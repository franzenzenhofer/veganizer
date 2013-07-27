/*! yet-another-coffescript-skeleton - v0.0.2 - last build: 2013-07-23 11:08:05 */
(function() {
  var BIG_PIXEL_SIZE, RESIZE_FACTOR, coolectParts, dappend, dlog, drawRotatedImage, dummy_final, dummy_step, makeDraw, testimage, veganize, _DEBUG_;

  _DEBUG_ = true;

  testimage = $('#testimage').get(0);

  dlog = function(msg) {
    if (_DEBUG_) {
      console.log(msg);
    }
    return msg;
  };

  dappend = function(c) {
    if (_DEBUG_) {
      return $('body').append(c);
    }
  };

  RESIZE_FACTOR = 5;

  BIG_PIXEL_SIZE = 15;

  drawRotatedImage = function(image, context, x, y, angle) {
    var TO_RADIANS;
    TO_RADIANS = Math.PI / 180;
    context.save();
    context.translate(x, y);
    context.rotate(angle * TO_RADIANS);
    context.drawImage(image, -(image.width / 2), -(image.height / 2));
    return context.restore();
  };

  makeDraw = function(ctx, parts) {
    return function(color, x, y, rotation, mirror, i) {
      var fitness, part_to_draw;
      if (rotation == null) {
        rotation = 0;
      }
      if (mirror == null) {
        mirror = false;
      }
      fitness = function(c2, c1) {
        var color1, color2, dif;
        color1 = pusher.color("rgba(" + c1[0] + "," + c1[1] + "," + c1[2] + "," + c1[3] + ")");
        color2 = pusher.color("rgba(" + c2[0] + "," + c2[1] + "," + c2[2] + "," + c2[3] + ")");
        dif = color1.hue() - color2.hue();
        if (dif < 0) {
          return dif * -1;
        } else {
          return dif;
        }
      };
      part_to_draw = _.first(_.sortBy(parts, function(p) {
        return fitness(p.color, color);
      }));
      if (mirror) {
        drawRotatedImage(FE.mirror(part_to_draw.part), ctx, x * BIG_PIXEL_SIZE, y * BIG_PIXEL_SIZE, rotation);
      } else {
        drawRotatedImage(part_to_draw.part, ctx, x * BIG_PIXEL_SIZE, y * BIG_PIXEL_SIZE, rotation);
      }
      return [color, x, y, i];
    };
  };

  coolectParts = function(cb) {
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
          dlog(r + " " + g + " " + b);
          return collector.push({
            "part": part_canvas,
            "color": [r, g, b, 1.0]
          });
        };
        FE.rgba(oneone, filter, (function(c) {
          return null;
        }));
      }
      if (collector.length === $('.parts').size()) {
        _.each(collector, function(p) {
          dappend($('<div><span style="background-color:rgba(' + p.color[0] + ',' + p.color[1] + ',' + p.color[2] + ',' + p.color[3] + ')">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>'));
          return dappend($(p.part));
        });
        dlog(collector);
        return cb(collector);
      }
    };
    return $('.parts').each(function(x) {
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

  veganize = function(c, parts, out_w, out_h, step_cb, final_cb) {
    var draw, drawingLoop, end, filter, i, new_c, new_ctx, new_img_data, new_img_data_data, rc, rh, rpx, rw, shuffeled_rpx, _ref;
    if (out_w == null) {
      out_w = c.width;
    }
    if (out_h == null) {
      out_h = c.height;
    }
    if (step_cb == null) {
      step_cb = dummy_step;
    }
    if (final_cb == null) {
      final_cb = dummy_final;
    }
    rw = Math.floor(c.width / RESIZE_FACTOR);
    rh = Math.floor(c.height / RESIZE_FACTOR);
    rc = FE.pixelyResize(FE.invert(c, 0.0), rw, rh);
    dappend(rc);
    dappend(FE.pixelyResize(rc, c.width, c.height));
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
    FE.rgba(rc, filter, (function(c) {
      return null;
    }));
    _ref = FE.newCanvasToolbox(rw * BIG_PIXEL_SIZE, rh * BIG_PIXEL_SIZE), new_c = _ref[0], new_ctx = _ref[1], new_img_data = _ref[2], new_img_data_data = _ref[3];
    draw = makeDraw(new_ctx, parts);
    shuffeled_rpx = _.shuffle(rpx);
    i = 0;
    end = false;
    return (drawingLoop = function() {
      var out_canvas, x, _fn, _i;
      if (i >= shuffeled_rpx.length) {
        out_canvas = FE.hardResize(new_c, out_w, out_h);
        return final_cb(out_canvas, new_c);
      } else {
        _fn = function(x) {
          var p, z;
          z = i + x;
          p = shuffeled_rpx[z];
          if (p) {
            draw(p.color, p.x, p.y, p.rotation, p.mirror, i);
            return step_cb(FE.hardResize(new_c, out_w, out_h), new_c);
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

  coolectParts(function(parts) {
    return FE.byImage(testimage, (function(c) {
      return veganize(c, parts);
    }));
  });

}).call(this);
