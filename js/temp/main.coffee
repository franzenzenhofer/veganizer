# /*! yet-another-coffescript-skeleton - v0.0.2 - last build: 2013-08-25 22:08:27 */
_DEBUG_ = false

dlog = (msg, debug = _DEBUG_) -> 
  console.log(msg) if debug
  return msg

dappend = (c, debug = _DEBUG_) -> 
  $('body').append(c) if debug
  return c

append = (c) -> 
  $('body').append(c) 
  return c

drawRotatedImage = (image, context, x=0, y=0, angle=0) -> 
  TO_RADIANS = Math.PI/180
  context.save();
  context.translate(x, y)
  context.rotate(angle * TO_RADIANS)
  context.drawImage(image, -(image.width/2), -(image.height/2))
  context.restore()
  return true

getBrightness = (r,g,b) -> (3*r+4*g+b)>>>3

brightnessSortForExtendedPixels = (a_extended,b_extended)-> 
  a = a_extended.color
  b = b_extended.color
  #sorty_value = ((3*a[0]+4*a[1]+a[2])>>>3) - ((3*b[0]+4*b[1]+b[2])>>>3)
  return getBrightness(a[0], a[1], a[2]) - getBrightness(b[0], b[1], b[2])

drawExtendedPixelWithPart = (ctx, part_to_draw, x = 0, y = 0, rotation = 0, mirror = false) ->
  if mirror
    drawRotatedImage(FE.mirror(part_to_draw.part), ctx, x, y, rotation)
  else
    drawRotatedImage(part_to_draw.part, ctx, x, y, rotation)
  return true

makeDrawByBrightness = (ctx, parts, pixel_w_h) ->
  nr_of_buckets = parts.length
  sorted_by_brightness_parts = parts.sort(brightnessSortForExtendedPixels)
  
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

#pixelyResize = (c,w,h) ->
#  debugger
#  [new_c, new_ctx]=FE.newCanvasToolbox(w, h)
#  new_ctx?.webkitImageSmoothingEnabled = false
#  new_ctx?.imageSmoothingEnabled = false
#  new_ctx?.mozImageSmoothingEnabled = false
#  new_ctx.drawImage(c, 0, 0, w, h)
#  return new_c

createPixelyVersion = (c, max_w_h = 100) ->
  if c.width >= c.height
    rw = max_w_h
    rh = c.height * rw/c.width
  else
    rh = max_w_h
    rw = c.width * rh/c.height
  rw = Math.floor(rw)
  rh = Math.floor(rh)
  rc = FE.pixelyResize(c, rw, rh)
  #rc = pixelyResize(c, rw, rh)
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

n = () -> null


drawWithPicsInsteadOfPixels = (c, parts, overlap=0.3, before_cb = n, step_cb = n, final_cb = n) ->
  if overlap >= 1 then overlap = 0.65
  if overlap <0.2 then overlap = 0.2
  [rc, rw, rh] = createPixelyVersion(c, 100) 
  pixel_w_h = createIdealPixelWH(parts, overlap)
  dlog('pixel_w_h: '+pixel_w_h)

  [new_c, new_ctx] = dlog(FE.newCanvasToolbox(rw*pixel_w_h, rh*pixel_w_h))
  #we create our own very cool draw function
  draw = makeDrawByBrightness(new_ctx, parts, pixel_w_h)

  #extend and shuffle the pixels
  shuffeled_rpx = _.shuffle(extendPixels(rc))
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

collectParts = (selector, cb) ->
  collector = []

  collectItAll = (part_canvas, rgb) ->
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
  return true

#before = (c) -> append(c)
#step = (c) -> dappend(c)
#finish = (c) -> dappend(c)
#
#collectParts('.parts', (parts)->
#  FE.byImage($('#testimage').get(0), (
#    (c)->drawWithPicsInsteadOfPixels(c, parts, 0.55, before, step, finish))
#  )
#)




filepicker.setKey('ApeMsWqEOSBuCzqARVfHLz')



drawing_parts = []
OVERLAP = 0.55
display_image_width = 0
display_image_height = 0
step_canvas = $('<canvas>').get(0)
step_canvas_context = step_canvas.getContext('2d')
global_image_name = "veganizer-veganblatt"
global_stored = false
global_show_storage_progress = false

before = (c) ->
  step_canvas.width = display_image_width
  step_canvas.height = display_image_height
  $('#post_file_select').hide()
  $('#step_by_step').show()
  $('#step_veganized').html(step_canvas)

step = (c, a, b) -> 
  step_canvas_context.drawImage(c, 0, 0, display_image_width, display_image_height)
  #console.log('a:'+a)
  #console.log('b:'+b)
  prog = (a/b).toFixed(2)
  prog_per = Math.floor(prog*100)
  $('#progress').html(prog_per+'%')
  return null

storeCanvas = (c, cb, 
  error_cb = ((e)->console.log(e)),
  progress_cb = ((p)-> console.log(p)) ) ->
  console.log('in store canvas')
  console.log(c)
  b64 = c.toDataURL('image/jpeg').split(',', 2)[1]
  filepicker.store(b64, {
    mimetype: 'image/jpeg'
    base64decode: true
    }, cb, error_cb, progress_cb) 

finalExport = (inkblob) ->
  console.log(inkblob)
  filepicker.exportFile(inkblob, {suggestedFilename: global_image_name},
    (inkblob) -> console.log(inkblob),
    (error) -> console.log(error)
    )

finish = (c) -> 
  console.log('finished')
  logo = $('#veganblatt_logo').get(0)
  c_ctx = c.getContext('2d')
  c_ctx.drawImage(logo, c.width-(logo.width+15), c.height-(logo.height+10))
  #reusing the step canvas
  step_canvas_context.drawImage(c, 0, 0, display_image_width, display_image_height)
  
  $('#export').on('click', ()->
    if global_stored is false
      global_show_storage_progress = true
  )

  storageProgress = (p) ->
    s = "Save image (to disk, Fb, ...)"
    if global_show_storage_progress
      if p < 100
        $('#export').attr('disabled', 'disabled')
        $('#export').html(s+' '+p+'%')
      else
        $('#export').html(s)



  enableExport = (inkblob) ->
    #console.log(inkblob)
    global_stored = true
    $('#export').on('click', (()->finalExport(inkblob)))
    $('#export').attr('disabled', false)

  #storeitinS3
  storeCanvas(c, enableExport, undefined, storageProgress)

  #final_image.width = display_image_width
  #final_image.height = display_image_height
  $('#finished_image').html(step_canvas)
  $('#step_by_step').hide()
  $('#finished').show()
  #final_image = FE.toImage(c)

  #$('#export').on('click', exportHiRes)
  return null

resizeImage = (image) ->
  image_max_width = $(window).width()*0.8
  image_max_height = $(window).height()*0.8

  if (image.width >= image_max_width) or (image.height >= image_max_height)
    if image.width >= image.height
      nw = image_max_width 
      nh = image.height * nw / image.width
      if nh > image_max_height
        n_nh = image_max_height
        n_nw = nw * n_nh / nh
        nh = n_nh
        nw = n_nw
    else
      nh = image_max_height
      nw = image.width * nh / image.height
      if nw > image_max_width
        n_nw = image_max_width
        n_nh = nh * n_nw / nw
        nh = n_nh
        nw = n_nw
    image.width = nw
    image.height = nh
    console.log(image)
  display_image_width = image.width
  display_image_height = image.height
  return image

gotFile = (inkblob, data) ->
  filename = inkblob?.filename?.match(/(.*)\.[^.]+$/)?[1] or inkblob.filename
  global_image_name = 'veganblatt-'+filename+'-veganizer' if filename
  image = new Image()
  image.addEventListener("load", ()->
    console.log('dsfdsjhgdjlks')
    r_image = resizeImage(image)
    $('#call_to_action').hide()
    $('#to_veganize').html(r_image)
    $('#post_file_select').show()
    startVeganize = () ->
      console.log('start Veganize')
      FE.byImage(r_image, ((image_canvas)->drawWithPicsInsteadOfPixels(image_canvas, drawing_parts, OVERLAP, before, step, finish)))
    
    $('#start_veganize').on('click', startVeganize)   
  , false)
  
  image.src = 'data:'+inkblob.mimetype+';base64,'+data
  




pick = () ->
  filepicker.pick({mimetype: 'image/*'}, (inkblob) ->
    #console.log(inkblob)
    #console.log(inkblob.url)
    filepicker.read(inkblob,{base64encode: true}, (data) -> 
      gotFile(inkblob, data)
    , (error) -> 
      console.log(error)
    )
  )

toCanvas = (x) -> console.log(x)

collectParts('.parts', (parts)-> 
  drawing_parts = parts 
  $('#choose_image').on('click', pick)
)

