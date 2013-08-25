(function() {
  var OVERLAP, append, before, brightnessSortForExtendedPixels, collectParts, createIdealPixelWH, createPixelyVersion, dappend, dlog, drawExtendedPixelWithPart, drawRotatedImage, drawWithPicsInsteadOfPixels, drawing_parts, extendPixels, finish, getBrightness, gotFile, makeDrawByBrightness, n, pick, step, toCanvas, _DEBUG_;

  _DEBUG_ = false;

  dlog = function(msg, debug) {
    if (debug == null) {
      debug = _DEBUG_;
    }
    if (debug) {
      console.log(msg);
    }
    return msg;
  };

  dappend = function(c, debug) {
    if (debug == null) {
      debug = _DEBUG_;
    }
    if (debug) {
      $('body').append(c);
    }
    return c;
  };

  append = function(c) {
    $('body').append(c);
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

  brightnessSortForExtendedPixels = function(a_extended, b_extended) {
    var a, b;
    a = a_extended.color;
    b = b_extended.color;
    return getBrightness(a[0], a[1], a[2]) - getBrightness(b[0], b[1], b[2]);
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
      rh = c.height * rw / c.width;
    } else {
      rh = max_w_h;
      rw = c.width * rh / c.height;
    }
    rw = Math.floor(rw);
    rh = Math.floor(rh);
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

  n = function() {
    return null;
  };

  drawWithPicsInsteadOfPixels = function(c, parts, overlap, before_cb, step_cb, final_cb) {
    var draw, drawingLoop, draws_per_loop, i, loop_i, new_c, new_ctx, pixel_w_h, rc, rh, rpx_length, rw, shuffeled_rpx, total_loops, _ref, _ref1;
    if (overlap == null) {
      overlap = 0.3;
    }
    if (before_cb == null) {
      before_cb = n;
    }
    if (step_cb == null) {
      step_cb = n;
    }
    if (final_cb == null) {
      final_cb = n;
    }
    if (overlap >= 1) {
      overlap = 0.65;
    }
    if (overlap < 0.2) {
      overlap = 0.2;
    }
    _ref = createPixelyVersion(c, 100), rc = _ref[0], rw = _ref[1], rh = _ref[2];
    pixel_w_h = createIdealPixelWH(parts, overlap);
    dlog('pixel_w_h: ' + pixel_w_h);
    _ref1 = dlog(FE.newCanvasToolbox(rw * pixel_w_h, rh * pixel_w_h)), new_c = _ref1[0], new_ctx = _ref1[1];
    draw = makeDrawByBrightness(new_ctx, parts, pixel_w_h);
    shuffeled_rpx = _.shuffle(extendPixels(rc));
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
    $(selector).each(function(x) {
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
    return true;
  };

  filepicker.setKey('ApeMsWqEOSBuCzqARVfHLz');

  drawing_parts = [];

  OVERLAP = 0.55;

  before = function(c) {
    return $('body').append(c);
  };

  step = function(c) {
    return null;
  };

  finish = function(c) {
    return null;
  };

  gotFile = function(inkblob, data) {
    var image;
    image = new Image();
    image.addEventListener("load", function() {
      var image_max_height, image_max_width, n_nh, n_nw, nh, nw, startVeganize;
      image_max_width = $(window).width() * 0.8;
      image_max_height = $(window).height() * 0.8;
      if ((image.width >= image_max_width) || (image.height >= image_max_height)) {
        if (image.width >= image.height) {
          nw = image_max_width;
          nh = image.height * nw / image.width;
          if (image.height > image_max_height) {
            n_nh = image_max_height;
            n_nw = nw * n_nh / nh;
            nh = n_nh;
            nw = n_nw;
          }
        } else {
          nh = image_max_height;
          nw = image.width * nh / image.height;
          if (image.width > image_max_width) {
            n_nw = image_max_width;
            n_nh = nh * n_nw / nw;
            nh = n_nh;
            nw = n_nw;
          }
        }
        image.width = nw;
        image.height = nh;
      }
      $('#to_veganize').html(image);
      startVeganize = function() {
        return FE.byImage(image, (function(image_canvas) {
          return drawWithPicsInsteadOfPixels(image_canvas, drawing_parts, OVERLAP, before, step, finish);
        }));
      };
      return $('#start_veganize').on('click', startVeganize);
    }, false);
    return image.src = 'data:' + inkblob.mimetype + ';base64,' + data;
  };

  pick = function() {
    return filepicker.pick({
      mimetype: 'image/*'
    }, function(inkblob) {
      console.log(inkblob);
      console.log(inkblob.url);
      return filepicker.read(inkblob, {
        base64encode: true
      }, function(data) {
        return gotFile(inkblob, data);
      }, function(error) {
        return console.log(error);
      });
    });
  };

  toCanvas = function(x) {
    return console.log(x);
  };

  collectParts('.parts', function(parts) {
    drawing_parts = parts;
    return $('#choose_image').on('click', pick);
  });

}).call(this);
