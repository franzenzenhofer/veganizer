(function() {
  var BIG_PIXEL_SIZE, RESIZE_FACTOR, brightnessSortForExtendedPixels, coolectParts, createPixelyVersion, dappend, dlog, drawExtendedPixelWithPart, drawRotatedImage, dummy_final, dummy_step, extendPixels, getBrightness, makeDrawByBrightness, veganize, _DEBUG_;

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
      drawRotatedImage(FE.mirror(part_to_draw.part), ctx, x * BIG_PIXEL_SIZE, y * BIG_PIXEL_SIZE, rotation);
    } else {
      drawRotatedImage(part_to_draw.part, ctx, x * BIG_PIXEL_SIZE, y * BIG_PIXEL_SIZE, rotation);
    }
    return true;
  };

  makeDrawByBrightness = function(ctx, parts) {
    var nr_of_buckets, sorted_by_brightness_parts;
    nr_of_buckets = parts.length;
    sorted_by_brightness_parts = parts.sort(brightnessSortForExtendedPixels);
    dlog('sorted_by_brightness_parts');
    dlog(sorted_by_brightness_parts);
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
      drawExtendedPixelWithPart(ctx, part_to_draw, x, y, rotation, mirror);
      return [color, x, y, i];
    };
  };

  coolectParts = function(selector, w, h, cb) {
    var collectItAll, collector;
    collector = [];
    collectItAll = function(part_canvas, rgb) {
      var b, filter, g, oneone, r;
      part_canvas = FE.hardResize(part_canvas, w, h);
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

  dummy_step = function(out, full) {
    return $('#out').html(out);
  };

  dummy_final = function(out, full) {
    dappend(out);
    return dappend(full);
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

  createPixelyVersion = function(c, pixel_width, pixel_height, overlap, out_w, out_h) {
    var rc, rh, rw;
    if (pixel_width == null) {
      pixel_width = 20;
    }
    if (pixel_height == null) {
      pixel_height = 20;
    }
    if (overlap == null) {
      overlap = 0.2;
    }
    if (out_w == null) {
      out_w = c.width;
    }
    if (out_h == null) {
      out_h = c.height;
    }
    if (overlap >= 1) {
      overlap = 0;
    }
    rw = Math.floor(out_w / (pixel_width * (1 - overlap)));
    rh = Math.floor(out_h / (pixel_height * (1 - overlap)));
    rc = FE.pixelyResize(c, rw, rh);
    dappend(rc);
    return [rc, rw, rh];
  };

  veganize = function(c, parts, step_cb, final_cb) {
    var dis_h, dis_w, draw, drawingLoop, end, hire_h, hire_w, i, new_c, new_ctx, new_h, new_img_data, new_img_data_data, new_w, rc, rh, rpx, rw, shuffeled_rpx, _ref, _ref1;
    if (step_cb == null) {
      step_cb = dummy_step;
    }
    if (final_cb == null) {
      final_cb = dummy_final;
    }
    dis_w = c.width;
    dis_h = c.height;
    hire_w = dis_w * 5;
    hire_h = dis_h * 5;
    _ref = createPixelyVersion(c, parts[0].part.width, parts[0].part.height, 0.3, hire_w, hire_h), rc = _ref[0], rw = _ref[1], rh = _ref[2];
    dappend(rc);
    dappend(FE.pixelyResize(rc, c.width, c.height));
    new_w = Math.floor(rw * parts[0].part.width * (1 - 0.3));
    new_h = Math.floor(rh * parts[0].part.height * (1 - 0.3));
    _ref1 = FE.newCanvasToolbox(rw * BIG_PIXEL_SIZE, rh * BIG_PIXEL_SIZE), new_c = _ref1[0], new_ctx = _ref1[1], new_img_data = _ref1[2], new_img_data_data = _ref1[3];
    draw = makeDrawByBrightness(new_ctx, parts);
    rpx = extendPixels(rc);
    shuffeled_rpx = _.shuffle(rpx);
    i = 0;
    end = false;
    return (drawingLoop = function() {
      var hire_canvas, x, _fn, _i;
      if (i >= shuffeled_rpx.length) {
        hire_canvas = FE.hardResize(new_c, hire_w, hire_h);
        return final_cb(hire_canvas, new_c);
      } else {
        _fn = function(x) {
          var p, z;
          z = i + x;
          p = shuffeled_rpx[z];
          if (p) {
            draw(p.color, p.x, p.y, p.rotation, p.mirror, i);
            return step_cb(FE.hardResize(new_c, dis_w, dis_h), new_c);
          }
        };
        for (x = _i = 0; _i <= 10; x = ++_i) {
          _fn(x);
        }
        i = i + 10;
        return requestAnimationFrame(drawingLoop);
      }
    })();
  };

  coolectParts('.parts', 40, 40, function(parts) {
    return FE.byImage($('#testimage').get(0), (function(c) {
      return veganize(c, parts);
    }));
  });

}).call(this);
