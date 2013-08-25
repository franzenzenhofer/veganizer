filepicker.setKey('ApeMsWqEOSBuCzqARVfHLz')

drawing_parts = []
OVERLAP = 0.55

before = (c) ->
  $('body').append(c)

step = (c) -> null

finish = (c) -> null

gotFile = (inkblob, data) ->
  image = new Image()
  image.addEventListener("load", ()->
    image_max_width = $(window).width()*0.8
    image_max_height = $(window).height()*0.8

    if (image.width >= image_max_width) or (image.height >= image_max_height)
      if image.width >= image.height
        nw = image_max_width 
        nh = image.height * nw / image.width
        if image.height > image_max_height
          n_nh = image_max_height
          n_nw = nw * n_nh / nh
          nh = n_nh
          nw = n_nw
      else
        nh = image_max_height
        nw = image.width * nh / image.height
        if image.width > image_max_width
          n_nw = image_max_width
          n_nh = nh * n_nw / nw
          nh = n_nh
          nw = n_nw
      image.width = nw
      image.height = nh

    #resize image logic
    $('#to_veganize').html(image)
    startVeganize = () ->
      FE.byImage(image, ((image_canvas)->drawWithPicsInsteadOfPixels(image_canvas, drawing_parts, OVERLAP, before, step, finish)))
    
    $('#start_veganize').on('click', startVeganize)   
  , false)
  
  image.src = 'data:'+inkblob.mimetype+';base64,'+data
  




pick = () ->
  filepicker.pick({mimetype: 'image/*'}, (inkblob) ->
    console.log(inkblob)
    console.log(inkblob.url)
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

