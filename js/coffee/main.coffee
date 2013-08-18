_DEBUG_ = true

RESIZE_FACTOR = 5
BIG_PIXEL_SIZE = 15

dlog = (msg) -> 
  console.log(msg) if _DEBUG_
  return msg

dappend = (c) -> 
  $('body').append(c) if _DEBUG_
  return c

drawRotatedImage = (image, context, x=0, y=0, angle=0) -> 
  TO_RADIANS = Math.PI/180
  context.save();
  context.translate(x, y)
  context.rotate(angle * TO_RADIANS)
  context.drawImage(image, -(image.width/2), -(image.height/2))
  context.restore()
  return true

getBrightness = (r,g,b) ->
  return (3*r+4*g+b)>>>3

brightnessSortForExtendedPixels = (ae,be)-> 
  a = ae.color
  b = be.color
  sorty_value = ((3*a[0]+4*a[1]+a[2])>>>3) - ((3*b[0]+4*b[1]+b[2])>>>3)
  return sorty_value

drawExtendedPixelWithPart = (ctx, part_to_draw, x = 0, y = 0, rotation = 0, mirror = false) ->
  if mirror
    drawRotatedImage(FE.mirror(part_to_draw.part), ctx, x, y, rotation)
  else
    drawRotatedImage(part_to_draw.part, ctx, x, y, rotation)
  return true

makeDrawByBrightness = (ctx, parts, pixel_w_h) ->
  nr_of_buckets = parts.length
  sorted_by_brightness_parts = parts.sort(brightnessSortForExtendedPixels)
  #dlog('sorted_by_brightness_parts')
  #dlog(sorted_by_brightness_parts)
  
  return (color,x,y,rotation=0, mirror=false, i) ->
    brightness = getBrightness(color[0], color[1], color[2])
    bucket_nr = Math.floor(brightness / 256 * nr_of_buckets)
    part_to_draw = sorted_by_brightness_parts[bucket_nr]
    drawExtendedPixelWithPart(ctx, part_to_draw, x*pixel_w_h, y*pixel_w_h, rotation, mirror)
    return [color,x,y,i]

#old algorihtm using http://tech.pusherhq.com/libraries/color .hue function
#makeDraw = (ctx, parts) ->
#  return (color,x,y,rotation=0, mirror=false, i) ->
#    fitness = (c2, c1) ->
#      color1 = pusher.color("rgba("+c1[0]+","+c1[1]+","+c1[2]+","+c1[3]+")")
#      color2 = pusher.color("rgba("+c2[0]+","+c2[1]+","+c2[2]+","+c2[3]+")")
#      dif = color1.hue() - color2.hue()
#      Math.abs(dif)
#    part_to_draw = _.first(_.sortBy(parts, (p)-> fitness(p.color, color)))
#    drawExtendedPixelWithPart(ctx, part_to_draw, x, y, rotation, mirror)
#    return [color,x,y,i]

collectParts = (selector, cb) ->
  collector = []

  collectItAll = (part_canvas, rgb) ->
    #part_canvas = FE.hardResize(part_canvas, w, h)
    #part_canvas = FE.copy(part_canvas)
    if rgb and rgb.length is 3
        [r,g,b] = rgb
        collector.push({
        "part": part_canvas
        "color": [r,g,b,1.0]
        })
    else
      oneone = FE.pixelyResize(part_canvas,1,1)
      filter = (r,g,b,a,i) -> 
        collector.push({
        "part": part_canvas
        "color": [r,g,b,1.0]
        })
      FE.rgba(oneone,filter,((c)->null))
    
    #after we have collected all parts
    if collector.length is $(selector).size()
      _.each(collector, (p)->
        dappend($('<div><span style="background-color:rgba('+p.color[0]+','+p.color[1]+','+p.color[2]+','+p.color[3]+')">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>'))
        dappend($(p.part))
        )
      cb(collector)

  $(selector).each((x)->
    data_rgb = false
    string_data_rgb = $(this).attr('data-rgb')
    if string_data_rgb
      data_rgb = _.map(string_data_rgb.split(','), ((x)->parseInt(x)))
    FE.byImage(this, (c)-> (collectItAll(c, data_rgb)))
    )




#createPixelyVersion = (c) ->
#  #make a pixely version of the c canvas
#  rw = Math.floor(c.width/RESIZE_FACTOR)
#  rh = Math.floor(c.height/RESIZE_FACTOR)
#  rc = FE.pixelyResize(FE.invert(c, 0.0), rw, rh)
#  dappend(rc)
#  return [rc, rw, rh]

extendPixels = (c) ->
  #create an array with extended veganized pixels
  rw = c.width
  rh = c.height
  rpx = []
  filter = (r,g,b,a, i) -> 
    pnr = Math.floor(i/4)
    rpx.push(
      y: Math.floor(pnr/rw)
      x: Math.floor(pnr%rw)
      color: [r,g,b,1.0]
      "rotation": _.random(0,360)
      "mirror": (if _.random(0,1) is 0 then false else true)
      pixel_nr: pnr
      )
  FE.rgba(c,filter,((c)->null))
  return rpx


#createPixelyVersion = (c, pixel_width = 20, pixel_height = 20, overlap = 0.2, out_w = c.width, out_h = c.height) ->
#  if overlap >= 1 then overlap = 0
#  rw = Math.floor(out_w/(pixel_width*(1-overlap)))
#  rh = Math.floor(out_h/(pixel_height*(1-overlap)))
#  rc = FE.pixelyResize(c, rw, rh)
#  dappend(rc)
#  return [rc, rw, rh]  

createPixelyVersion = (c, max_w_h = 100) ->
  if c.width >= c.height
    rw = max_w_h
    rh = c.heigth * rw/c.width
  else
    rh = max_w_h
    rw = c.width * rh/c.height
  rc = FE.pixelyResize(c, rw, rh)
  dappend(rc)
  return [rc, rw, rh] 

createIdealPixelWH = (parts, overlap) ->

  non_overlap = 1 - overlap
  pixel_w_h = 0
  for p in parts
    do (p) ->
      pixel_w_h = pixel_w_h + p.part.width + p.part.height
  pixel_w_h = Math.floor(pixel_w_h/(parts.length*2)*non_overlap)
  return pixel_w_h

dummy_before = (c) -> return null

dummy_step = (c, loop_i, total_loops) -> return null

dummy_final = (c) -> return null

veganize = (c, parts, overlap=0.3, before_cb = dummy_before, step_cb = dummy_step, final_cb = dummy_final) ->
  if overlap >= 1 then overlap = 0.3
  dis_w = c.width
  dis_h = c.height 

  [rc, rw, rh] = createPixelyVersion(c, 100) 

  pixel_w_h = createIdealPixelWH(parts, overlap)
  dlog(pixel_w_h)

  [new_c, new_ctx, new_img_data, new_img_data_data] = dlog(FE.newCanvasToolbox(rw*pixel_w_h, rh*pixel_w_h))
  #[new_c, new_ctx, new_img_data, new_img_data_data] = FE.newCanvasToolbox(new_w, new_h)


  #draw = makeDraw(new_ctx, parts)
  draw = makeDrawByBrightness(new_ctx, parts, pixel_w_h)

  rpx = extendPixels(rc)
  #make the draws random
  shuffeled_rpx = _.shuffle(rpx)
  rpx_length = shuffeled_rpx.length
  draws_per_loop = 10
  before_cb(new_c)
  
  i = 0
  loop_i = 0
  total_loops = Math.ceil(shuffeled_rpx.length/draws_per_loop)
  
  do drawingLoop = () ->
    if i >= rpx_length
      final_cb(new_c)
    else
      for x in [0..draws_per_loop]
        do (x) ->
          p = shuffeled_rpx[i+x]
          if p then draw(p.color,p.x,p.y,p.rotation,p.mirror,i)
      step_cb(new_c, loop_i, total_loops) 
      
      i = i + draws_per_loop
      loop_i = loop_i + 1
      requestAnimationFrame(drawingLoop)

  #for p,i in shuffeled_rpx
  #  do (p) ->
  #    dlog(p)
  #    draw(p.color,p.x,p.y,p.rotation,p.mirror,i)
      #new_ctx.fillStyle = "rgba("+p.color.join(',')+")"
      #new_ctx.drawCircle(20+p.y*RESIZE_FACTOR,20+p.x*RESIZE_FACTOR,8)
  #dappend(FE.hardResize(new_ctx,c.width,c.height))
  
  #dappend(out_canvas)
  #dappend(new_c)
  #the callback gets the final 
  
  #_.each()

before = (c) -> dappend(c)
step = (c) -> dappend(c)
finish = (c) -> dappend(c)


collectParts('.parts', (parts)->
  FE.byImage($('#testimage').get(0), (
    (c)->veganize(c, parts, 0.65, before, step, finish))
  )
)



