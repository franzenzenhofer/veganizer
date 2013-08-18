/*! yet-another-coffescript-skeleton - v0.0.2 - last build: 2013-08-17 18:51:14 */
(function() {
  var BIG_PIXEL_SIZE, RESIZE_FACTOR, before, brightnessSortForExtendedPixels, collectParts, createIdealPixelWH, createPixelyVersion, dappend, dlog, drawExtendedPixelWithPart, drawRotatedImage, dummy_before, dummy_final, dummy_step, extendPixels, finish, getBrightness, makeDrawByBrightness, step, veganize, _DEBUG_;

  _DEBUG_ = true;

  RESIZE_FACTOR = 5;

  BIG_PIXEL_SIZE = 15;

  dlog = function(msg) {
    if (_DEBUG_) {
      console.log(msg);
    }
    return msg;
  };

  dappend = function(c) {
    if (_DEBUG_) {
      $('body').append(c);
    }
    return c;
  };

  drawRotatedImage = function(image, context, x, y, angle) {
    var TO_RADIANS;
    if (x == null) {
      x = 0;
    }
    if (y == null) {
      y = 0;
    }
    if (angle == null) {
      angle = 0;
    }
    TO_RADIANS = Math.PI / 180;
    context.save();
    context.translate(x, y);
    context.rotate(angle * TO_RADIANS);
    context.drawImage(image, -(image.width / 2), -(image.height / 2));
    context.restore();
    return true;
  };

  getBrightness = function(r, g, b) {
    return (3 * r + 4 * g + b) >>> 3;
  };

  brightnessSortForExtendedPixels = function(ae, be) {
    var a, b, sorty_value;
    a = ae.color;
    b = be.color;
    sorty_value = ((3 * a[0] + 4 * a[1] + a[2]) >>> 3) - ((3 * b[0] + 4 * b[1] + b[2]) >>> 3);
    return sorty_value;
  };

  drawExtendedPixelWithPart = function(ctx, part_to_draw, x, y, rotation, mirror) {
    if (x == null) {
      x = 0;
    }
    if (y == null) {
      y = 0;
    }
    if (rotation == null) {
      rotation = 0;
    }
    if (mirror == null) {
      mirror = false;
    }
    if (mirror) {
      drawRotatedImage(FE.mirror(part_to_draw.part), ctx, x, y, rotation);
    } else {
      drawRotatedImage(part_to_draw.part, ctx, x, y, rotation);
    }
    return true;
  };

  makeDrawByBrightness = function(ctx, parts, pixel_w_h) {
    var nr_of_buckets, sorted_by_brightness_parts;
    nr_of_buckets = parts.length;
    sorted_by_brightness_parts = parts.sort(brightnessSortForExtendedPixels);
    return function(color, x, y, rotation, mirror, i) {
      var brightness, bucket_nr, part_to_draw;
      if (rotation == null) {
        rotation = 0;
      }
      if (mirror == null) {
        mirror = false;
      }
      brightness = getBrightness(color[0], color[1], color[2]);
      bucket_nr = Math.floor(brightness / 256 * nr_of_buckets);
      part_to_draw = sorted_by_brightness_parts[bucket_nr];
      drawExtendedPixelWithPart(ctx, part_to_draw, x * pixel_w_h, y * pixel_w_h, rotation, mirror);
      return [color, x, y, i];
    };
  };

  collectParts = function(selector, cb) {
    var collectItAll, collector;
    collector = [];
    collectItAll = function(part_canvas, rgb) {
      var b, filter, g, oneone, r;
      if (rgb && rgb.length === 3) {
        r = rgb[0], g = rgb[1], b = rgb[2];
        collector.push({
          "part": part_canvas,
          "color": [r, g, b, 1.0]
        });
      } else {
        oneone = FE.pixelyResize(part_canvas, 1, 1);
        filter = function(r, g, b, a, i) {
          return collector.push({
            "part": part_canvas,
            "color": [r, g, b, 1.0]
          });
        };
        FE.rgba(oneone, filter, (function(c) {
          return null;
        }));
      }
      if (collector.length === $(selector).size()) {
        _.each(collector, function(p) {
          dappend($('<div><span style="background-color:rgba(' + p.color[0] + ',' + p.color[1] + ',' + p.color[2] + ',' + p.color[3] + ')">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>'));
          return dappend($(p.part));
        });
        return cb(collector);
      }
    };
    return $(selector).each(function(x) {
      var data_rgb, string_data_rgb;
      data_rgb = false;
      string_data_rgb = $(this).attr('data-rgb');
      if (string_data_rgb) {
        data_rgb = _.map(string_data_rgb.split(','), (function(x) {
          return parseInt(x);
        }));
      }
      return FE.byImage(this, function(c) {
        return collectItAll(c, data_rgb);
      });
    });
  };

  extendPixels = function(c) {
    var filter, rh, rpx, rw;
    rw = c.width;
    rh = c.height;
    rpx = [];
    filter = function(r, g, b, a, i) {
      var pnr;
      pnr = Math.floor(i / 4);
      return rpx.push({
        y: Math.floor(pnr / rw),
        x: Math.floor(pnr % rw),
        color: [r, g, b, 1.0],
        "rotation": _.random(0, 360),
        "mirror": (_.random(0, 1) === 0 ? false : true),
        pixel_nr: pnr
      });
    };
    FE.rgba(c, filter, (function(c) {
      return null;
    }));
    return rpx;
  };

  createPixelyVersion = function(c, max_w_h) {
    var rc, rh, rw;
    if (max_w_h == null) {
      max_w_h = 100;
    }
    if (c.width >= c.height) {
      rw = max_w_h;
      rh = c.heigth * rw / c.width;
    } else {
      rh = max_w_h;
      rw = c.width * rh / c.height;
    }
    rc = FE.pixelyResize(c, rw, rh);
    dappend(rc);
    return [rc, rw, rh];
  };

  createIdealPixelWH = function(parts, overlap) {
    var non_overlap, p, pixel_w_h, _fn, _i, _len;
    non_overlap = 1 - overlap;
    pixel_w_h = 0;
    _fn = function(p) {
      return pixel_w_h = pixel_w_h + p.part.width + p.part.height;
    };
    for (_i = 0, _len = parts.length; _i < _len; _i++) {
      p = parts[_i];
      _fn(p);
    }
    pixel_w_h = Math.floor(pixel_w_h / (parts.length * 2) * non_overlap);
    return pixel_w_h;
  };

  dummy_before = function(c) {
    return null;
  };

  dummy_step = function(c, loop_i, total_loops) {
    return null;
  };

  dummy_final = function(c) {
    return null;
  };

  veganize = function(c, parts, overlap, before_cb, step_cb, final_cb) {
    var dis_h, dis_w, draw, drawingLoop, draws_per_loop, i, loop_i, new_c, new_ctx, new_img_data, new_img_data_data, pixel_w_h, rc, rh, rpx, rpx_length, rw, shuffeled_rpx, total_loops, _ref, _ref1;
    if (overlap == null) {
      overlap = 0.3;
    }
    if (before_cb == null) {
      before_cb = dummy_before;
    }
    if (step_cb == null) {
      step_cb = dummy_step;
    }
    if (final_cb == null) {
      final_cb = dummy_final;
    }
    if (overlap >= 1) {
      overlap = 0.3;
    }
    dis_w = c.width;
    dis_h = c.height;
    _ref = createPixelyVersion(c, 100), rc = _ref[0], rw = _ref[1], rh = _ref[2];
    pixel_w_h = createIdealPixelWH(parts, overlap);
    dlog(pixel_w_h);
    _ref1 = dlog(FE.newCanvasToolbox(rw * pixel_w_h, rh * pixel_w_h)), new_c = _ref1[0], new_ctx = _ref1[1], new_img_data = _ref1[2], new_img_data_data = _ref1[3];
    draw = makeDrawByBrightness(new_ctx, parts, pixel_w_h);
    rpx = extendPixels(rc);
    shuffeled_rpx = _.shuffle(rpx);
    rpx_length = shuffeled_rpx.length;
    draws_per_loop = 10;
    before_cb(new_c);
    i = 0;
    loop_i = 0;
    total_loops = Math.ceil(shuffeled_rpx.length / draws_per_loop);
    return (drawingLoop = function() {
      var x, _fn, _i;
      if (i >= rpx_length) {
        return final_cb(new_c);
      } else {
        _fn = function(x) {
          var p;
          p = shuffeled_rpx[i + x];
          if (p) {
            return draw(p.color, p.x, p.y, p.rotation, p.mirror, i);
          }
        };
        for (x = _i = 0; 0 <= draws_per_loop ? _i <= draws_per_loop : _i >= draws_per_loop; x = 0 <= draws_per_loop ? ++_i : --_i) {
          _fn(x);
        }
        step_cb(new_c, loop_i, total_loops);
        i = i + draws_per_loop;
        loop_i = loop_i + 1;
        return requestAnimationFrame(drawingLoop);
      }
    })();
  };

  before = function(c) {
    return dappend(c);
  };

  step = function(c) {
    return dappend(c);
  };

  finish = function(c) {
    return dappend(c);
  };

  collectParts('.parts', function(parts) {
    return FE.byImage($('#testimage').get(0), (function(c) {
      return veganize(c, parts, 0.65, before, step, finish);
    }));
  });

}).call(this);
