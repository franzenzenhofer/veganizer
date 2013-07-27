
_DEBUG_ = true

testimage = $('#testimage').get(0)

dlog = (msg) -> 
  console.log(msg) if _DEBUG_
  return msg

dappend = (c) ->
  $('body').append(c) if _DEBUG_

RESIZE_FACTOR = 5
BIG_PIXEL_SIZE = 15


 
drawRotatedImage = (image, context, x, y, angle) -> 
  TO_RADIANS = Math.PI/180
  context.save();
  context.translate(x, y)
  context.rotate(angle * TO_RADIANS)
  context.drawImage(image, -(image.width/2), -(image.height/2))
  context.restore()


makeDraw = (ctx, parts) ->
  #dlog(parts)
  return (color,x,y,rotation=0, mirror=false, i) ->
    #dlog('in draw')
    #dlog(x+':'+y)
    fitness = (c2, c1) ->
      color1 = pusher.color("rgba("+c1[0]+","+c1[1]+","+c1[2]+","+c1[3]+")")
      color2 = pusher.color("rgba("+c2[0]+","+c2[1]+","+c2[2]+","+c2[3]+")")
      dif = color1.hue() - color2.hue()
      if (dif) < 0
        return dif * -1
      else
        return dif
    
    part_to_draw = _.first(_.sortBy(parts, (p)-> fitness(p.color, color)))

    #dlog('part to draw')
    #dlog(part_to_draw)
    #dlog('part to draw end')

    #ctx.fillStyle = "rgba("+part_to_draw.color.join(',')+")"
    #ctx.fillRect(x*BIG_PIXEL_SIZE, y*BIG_PIXEL_SIZE, BIG_PIXEL_SIZE, BIG_PIXEL_SIZE)
    #ctx.drawImage(part_to_draw.part, x*BIG_PIXEL_SIZE, y*BIG_PIXEL_SIZE)
    if mirror
      drawRotatedImage(FE.mirror(part_to_draw.part), ctx, x*BIG_PIXEL_SIZE, y*BIG_PIXEL_SIZE, rotation)
    else
      drawRotatedImage(part_to_draw.part, ctx, x*BIG_PIXEL_SIZE, y*BIG_PIXEL_SIZE, rotation)
    return [color,x,y,i]



coolectParts = (cb) ->
  collector = []

  collectItAll = (part_canvas, rgb) ->
    #dlog('hi')
    #data_rgb = $(part_canvas).attr('data-rgb')
    if rgb and rgb.length is 3
        [r,g,b] = rgb
        collector.push({
        "part": part_canvas
        "color": [r,g,b,1.0]
        })
    else
      oneone = FE.pixelyResize(part_canvas,1,1)
      filter = (r,g,b,a,i) -> 
        dlog(r+" "+g+" "+b)
        collector.push({
        "part": part_canvas
        "color": [r,g,b,1.0]
        })
      FE.rgba(oneone,filter,((c)->null))
    
    #dlog(collector.length)
    if collector.length is $('.parts').size()
      _.each(collector, (p)->
        dappend($('<div><span style="background-color:rgba('+p.color[0]+','+p.color[1]+','+p.color[2]+','+p.color[3]+')">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>'))
        dappend($(p.part))
        )
      dlog(collector)
      cb(collector)

  $('.parts').each((x)->
    #dlog(this)
    #dlog(this)
    data_rgb = false
    string_data_rgb = $(this).attr('data-rgb')
    if string_data_rgb
      data_rgb = _.map(string_data_rgb.split(','), ((x)->parseInt(x)))
    FE.byImage(this, (c)-> (collectItAll(c, data_rgb)))
    #dlog('ho')
    )

dummy_step = (out, full) ->
  #dappend(out)
  $('#out').html(out)
  #dappend(full)   

dummy_final = (out, full) ->
  dappend(out)
  dappend(full)


veganize = (c, parts, out_w=c.width, out_h=c.height, step_cb=dummy_step, final_cb=dummy_final) -> 

  #make a pixely version of the c canvas
  rw = Math.floor(c.width/RESIZE_FACTOR)
  rh = Math.floor(c.height/RESIZE_FACTOR)
  rc = FE.pixelyResize(FE.invert(c, 0.0), rw, rh)


  dappend(rc)
  dappend(FE.pixelyResize(rc, c.width, c.height))

  #create an array with extended veganized pixels
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
  FE.rgba(rc,filter,((c)->null))

  #this is the big version
  [new_c, new_ctx, new_img_data, new_img_data_data] = FE.newCanvasToolbox(rw*BIG_PIXEL_SIZE, rh*BIG_PIXEL_SIZE)

  draw = makeDraw(new_ctx, parts)

  #make the draws random
  shuffeled_rpx = _.shuffle(rpx)

  i = 0
  end = false
  do drawingLoop = () ->
    if i >= shuffeled_rpx.length
      out_canvas = FE.hardResize(new_c, out_w, out_h)
      final_cb(out_canvas, new_c)
    else
      for x in [0..10]
        do (x) ->
          z = i + x
          p = shuffeled_rpx[z]
          if p 
            draw(p.color,p.x,p.y,p.rotation,p.mirror,i)
            step_cb(FE.hardResize(new_c, out_w, out_h), new_c)
      i = i + 10
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



coolectParts((parts)->
  FE.byImage(testimage, (
    (c)->veganize(c,parts))
  )
)



