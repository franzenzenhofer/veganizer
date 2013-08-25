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

