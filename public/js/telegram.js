(function($) {
  $.fn.redraw = function() {
    return this.map(function(){ this.offsetTop; return this; });
  };
})(jQuery);

const Telegram = window.Telegram
let Cafe = {
  canPay: false,
  modeOrder: false,
  totalPrice: 0,
  location: null,
  formData: new FormData(),

  init: function(options) {
    Telegram.WebApp.ready();
    Cafe.apiUrl = options.apiUrl+'api/products/';
    Cafe.role = options.role;
    Cafe.mode = options.mode;
    Cafe.userId = options.userId;

    document.documentElement.className = Telegram.WebApp.colorScheme

    $('.js-item-lottie').on('click', Cafe.eLottieClicked);
    if (Cafe.role === 'admin')$('.js-item-lottie').on('contextmenu', Cafe.Edit);
    $('.js-item-incr-btn').on('click', Cafe.eIncrClicked);
    $('.js-item-decr-btn').on('click', Cafe.eDecrClicked);
    $('.cafe-order-edit').on('click', Cafe.eEditClicked);
    $('.js-status').on('click', Cafe.eStatusClicked);
    $('.js-selected-item-incr').on('click',Cafe.sIncrClicked);
    $('.js-selected-item-decr').on('click',Cafe.sDecrClicked);
    $(document).ready(Cafe.chosen)
    Telegram.WebApp.MainButton.setParams({
      text_color: '#fff',
      has_shine_effect: true
    }).onClick(Cafe.mainBtnClicked);
    Telegram.WebApp.BackButton.onClick(Cafe.backBtnClicked);
    if (Telegram.WebApp.version > 6){

      Telegram.WebApp.setHeaderColor("bg_color");
      const noop = function() {};
      console.log = noop;
      console.warn = noop;
      console.error = noop;
      console.info = noop;
      console.debug = noop;
      document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
      }, false);

      document.addEventListener('keydown', function (e) {
        if (e.key === 'F12') {
          e.preventDefault();
        }
      }, false);
    }else {
      document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
      }, false);

      document.documentElement.style.setProperty('--tg-theme-bg-color', '#ffffff');
    }
  },
  eIncrClicked: function(e) {
    e.preventDefault();
    Telegram.WebApp.HapticFeedback.impactOccurred('light');
    let itemEl = $(this).closest('.js-item');
    let data_id = itemEl.attr('data-item-id')
    Cafe.incrClicked(itemEl, 1,data_id);
  },
  eDecrClicked: function(e) {
    e.preventDefault();
    Telegram.WebApp.HapticFeedback.impactOccurred('light');
    let itemEl = $(this).closest('.js-item');
    Cafe.incrClicked(itemEl, -1);
  },
  eEditClicked: function(e) {
    e.preventDefault();
    Cafe.toggleMode(false);
  },
  backBtnClicked: function() {
    Cafe.toggleMode(false);
    document.activeElement && document.activeElement.blur();
  },
  getOrderItem: function(itemEl) {
    let id = itemEl.data('item-id');
    return $('.js-order-item').filter(function() {
      return ($(this).data('item-id') === id);
    });
  },
  updateItem: function(itemEl, delta) {
    let price = +itemEl.data('item-price');
    let count = +itemEl.data('item-count') || 0;
    let counterEl = $('.js-item-counter', itemEl);
    counterEl.text(count ? count : 0);
    let isSelected = itemEl.hasClass('selected');

    let anim_name = isSelected ? (delta > 0 ? 'badge-incr' : (count > 0 ? 'badge-decr' : 'badge-hide')) : 'badge-show';
    let cur_anim_name = counterEl.css('animation-name');
    if ((anim_name === 'badge-incr' || anim_name === 'badge-decr') && anim_name === cur_anim_name) {
      anim_name += '2';
    }
    counterEl.css('animation-name', anim_name);
    itemEl.toggleClass('selected', count > 0);

    let orderItemEl = Cafe.getOrderItem(itemEl);
    let orderCounterEl = $('.js-order-item-counter', orderItemEl);
    orderCounterEl.text(count ? count : 1);
    orderItemEl.toggleClass('selected', count > 0);
    let orderPriceEl = $('.js-order-item-price', orderItemEl);
    let item_price = count * price;
    orderPriceEl.text(Cafe.formatPrice(item_price));

    Cafe.updateTotalPrice();
  },
  animation: function(id) {
    let cafeItem = document.querySelector(`.cafe-item[data-item-id="${id}"]`);
    if (cafeItem) {
      let counterElement = cafeItem.querySelector('.cafe-item-counter');
      if (counterElement.textContent < 1 || '') {

        const imageElement = cafeItem.querySelector('img');
        const imageSrc = imageElement.getAttribute('src');

          imageElement.src = imageElement.getAttribute('data-item-short');
          setTimeout(() => {
            imageElement.src = imageSrc;
          }, 3110);
      }
    }
  },
  incrClicked: function(itemEl, delta,data_id) {

    let count = +itemEl.data('item-count') || 0;
    count += delta;
    if (count < 0) {
      count = 0;
    }
    Cafe.animation(data_id)
    itemEl.data('item-count', count);

    Cafe.updateItem(itemEl, delta);
  },
  formatPrice: function(price) {
    return Cafe.formatNumber(price, 2, '.', ',') + ' SUM';
  },
  formatNumber: function(number, decimals = 0, decPoint = '.', thousandsSep = ',') {
    number = parseFloat(number) || 0;
    let n = number.toFixed(decimals);
    let [integer, decimal] = n.split('.');

    integer = integer.replace(/\B(?=(?:\d{3})+(?!\d))/g, thousandsSep);

    if (decimal && decimal.length < decimals) {
      decimal = decimal.padEnd(decimals, '0');
    }

    return decimal ? `${integer}${decPoint}${decimal}` : integer;
  },
  updateMainButton: function() {
    let mainButton = Telegram.WebApp.MainButton;
    if (Cafe.modeOrder) {
      if (Cafe.isLoading) {
        mainButton.setParams({
          is_visible: true,
          color: '#65c36d'
        }).showProgress();
      } else {
        mainButton.setParams({
          is_visible: !!Cafe.canPay,
          text: 'TO\'LOV ' + Cafe.formatPrice(Cafe.totalPrice),
          color: '#31b545'
        }).hideProgress();
      }
    } else {

      mainButton.setParams({
        is_visible: !!Cafe.canPay,
        text: 'BUYURTMANI KO\'RISH',
        color: '#31b545'
      }).hideProgress();
    }
    Telegram.WebApp.isClosingConfirmationEnabled = !!Cafe.canPay;
  },
  updateTotalPrice: function() {
    let total_price = 0;
    $('.js-item').each(function() {
      let itemEl = $(this)
      let price = +itemEl.data('item-price');
      let count = +itemEl.data('item-count') || 0;
      total_price += price * count;
    });
    Cafe.canPay = total_price > 0;
    Cafe.totalPrice = total_price;
    Cafe.updateMainButton();
  },
  getOrderData: function() {
    let order_data = [];
    $('.js-item').each(function() {
      let itemEl = $(this);
      let id    = itemEl.data('item-id');
      let count = +itemEl.data('item-count') || 0;
      if (count > 0) {
        order_data.push({id: id, count: count});
      }
    });
    return JSON.stringify(order_data);
  },
  toggleMode: function(mode_order) {
    Cafe.modeOrder = mode_order;


    if (mode_order) {
      let height = $('.cafe-items').height();
      $('.cafe-order-overview').show();
      $('.cafe-items').css('maxHeight', height).redraw();
      $('body').addClass('order-mode');
      $('.cafe-page').css('margin-top','0');
      $('.category-navbar').css('position','unset');
      Telegram.WebApp.expand();
      Telegram.WebApp.BackButton.show();
    } else {
      $('body').removeClass('order-mode');
      Telegram.WebApp.BackButton.hide();
      $('.cafe-order-overview').hide();
      $('.cafe-page').css('margin-top','50px')
      $('.category-navbar').css('position','fixed');
    }
    Cafe.updateMainButton();
  },
  toggleLoading: function(loading) {
    Cafe.isLoading = loading;
    Cafe.updateMainButton();
    $('body').toggleClass('loading', !!Cafe.isLoading);
    Cafe.updateTotalPrice();
  },
  mainBtnClicked: function() {
    if (!Cafe.canPay || Cafe.isLoading) {
      return false;
    }
    if (Cafe.modeOrder) {
      let comment = $('.js-order-comment-field').val();


      let param = JSON.parse(Cafe.getOrderData())

      Cafe.formData.append('data', JSON.stringify(param));
      if (comment.length > 0){
        Cafe.formData.append('comment',comment)
      }
      Cafe.formData.append('user_id',`${Cafe.userId}`)


      let invoiceSupported = Telegram.WebApp.isVersionAtLeast('6.1');
      Cafe.toggleLoading(true);
      Cafe.apiRequest('post', Cafe.formData, function(result) {
        Cafe.toggleLoading(false);
        if (result.ok) {
          if (Cafe.mode === 'inline') {
            Telegram.WebApp.close();
          } else if (invoiceSupported) {
            Telegram.WebApp.close();
          } else {
            Telegram.WebApp.close();
          }
        }else {
          Telegram.WebApp.HapticFeedback.notificationOccurred('error');
          Cafe.showStatus(result.error,false);
        }
        if (result.error) {
          Telegram.WebApp.HapticFeedback.notificationOccurred('error');
          Cafe.showStatus(result.error,false);
        }
      });
    } else {
      Cafe.toggleMode(true);
    }
  },
  eLottieClicked: function(e) {
    e.preventDefault();
    Telegram.WebApp.HapticFeedback.impactOccurred('light');
    let itemEl = $(this).closest('.js-item');
    let imageSrc = itemEl.find('img').attr('src');
    let name = imageSrc.split('/').pop().split('_')[0];
    let data_id = itemEl.attr('data-item-id')
    Cafe.animation(name,data_id)
  },

  Edit: function (event) {
    const $modal = $('#myModal').show();
    const $cafeItem = $(this).closest('.cafe-item');
    const maxWidth = $(window).width() - $modal.outerWidth();
    const maxHeight = $(window).height() - $modal.outerHeight();

    let [x, y] = [event.pageX, event.pageY];
    x = Math.min(x, maxWidth);
    y = Math.min(y, maxHeight + $(window).scrollTop());

    $modal.css({ left: `${x}px`, top: `${y}px` });

    // Close modal logic
    $(window).off('click').one('click', function (e) {
      if ($modal.is(':visible') && !$modal[0].contains(e.target)) {
        $modal.hide();
        $('.modal-window').hide();
      }
    });

    $('.close-btn, .modal-overlay').off('click').on('click', function () {
      $modal.hide();
      $('.modal-window').hide();
    });

    // Load current item data
    let cafeItem = $(this).closest('.cafe-item');
    $('.edit-btn').one('click', function () {
      $modal.hide();
      $('.modal-window').show();

      let itemName = cafeItem.find('.cafe-item-title').text();
      let itemPrice = Cafe.formatNumber(cafeItem.data('item-price'), 2);
      let itemImage = cafeItem.find('img').attr('src');
      let itemVideo = `/public/img/stickers/${itemImage.replace('/public/img/', '').replace(/\.[^/.]+$/, '')}.webp`;

      $('#itemVideo').attr('src', '/public/img/loader.png');

      // Load video
      let video = new Image();
      video.onload = function () {
        $('#itemVideo').attr('src', itemVideo);
      };
      video.onerror = function () {
        $('#itemVideo').attr('src', '/public/img/imageNotFound.png');
      };
      video.src = itemVideo;

      $('#itemName').val(itemName);
      $('#itemPrice').val(itemPrice);
      $('#itemImage')
        .attr('src', itemImage)
        .on('error', function () {
          $(this).attr('src', '/public/img/imageNotFound.png');
        });
    });

    // Handle action buttons (edit/delete)
    $('.action').off('click').on('click', function () {
      let itemName = $('#itemName').val();
      const method = $(this).attr('data-item-btn') + '_item';
      let itemPrice = $('#itemPrice').val();
      let itemImage = $('#item_img')[0].files[0];
      let itemVideo = $('#item_video')[0].files[0];
      $('.js-order-description-field').val($cafeItem.attr('data-item-description'));

      let button = $(this);
      Cafe.toggleButtonLoading(button, true);

      // Create FormData object
      let formData = new FormData();
      formData.append('id', $cafeItem.attr('data-item-id'));
      formData.append('name', itemName);
      formData.append('price', itemPrice.replace(/,/g, ''));
      formData.append('category', $cafeItem.attr('data-item-category'));
      formData.append('description', $('.js-order-description-field').val());

      // Append image and video files if available
      if (itemImage) {
        formData.append('image', itemImage);
      }
      if (itemVideo) {
        formData.append('short_video', itemVideo);
      }

      // AJAX request
      const isEdit = method === 'edit_item';
      Cafe.apiRequest(isEdit ? 'put' : 'delete', formData, function (response,status) {
        const feedback = (status.status  === 204 ||status?.success) ? 'success' : 'warning';
        Telegram.WebApp.HapticFeedback.notificationOccurred(feedback);

        Cafe.toggleButtonLoading(button, false);

        if ((status.status  === 204 ||status?.success) && isEdit) {
          // Update UI with new item details
          $cafeItem.find('.cafe-item-title').text(itemName);
          $cafeItem.find('.cafe-item-price').text(`${itemPrice} SUM`);
          if (itemImage) {
            let reader = new FileReader();
            reader.onload = function (e) {
              $cafeItem.find('img').attr('src', e.target.result);
            };
            reader.readAsDataURL(itemImage);
          }
          if (itemVideo) {
            let videoUrl = URL.createObjectURL(itemVideo);
            $cafeItem.find('.cafe-item-video').attr('src', videoUrl);
          }
        } else if (!isEdit) {
          $cafeItem.hide();
          $modal.hide();
        }

        Cafe.showStatus(
          (status?.status === 204 || response?.ok)
            ? `Product ${isEdit ? 'updated' : 'deleted'} successfully`
            : 'Muammo yuzaga keldi',
          (status.status  === 204 ||status?.success)
        )

      }, $cafeItem.attr('data-item-id'));
    });

    // Image preview
    $('#item_img').off('change').change(function () {
      Cafe.handleFilePreview(this.files[0], $('#itemImage'));
    });

    // Video preview
    $('#item_video').off('change').change(function () {
      Cafe.handleFilePreview(this.files[0], $('#itemVideo'));
    });
  },

// Utility: Handle file preview
  handleFilePreview: function(file, $previewElement) {
  let reader = new FileReader();
  reader.onload = function (e) {
    const fileType = file.type.split('/')[0];
    if (fileType === 'image') {
      $previewElement.attr('src', e.target.result);
    } else if (fileType === 'video') {
      const videoElement = $('<video>', {
        src: e.target.result,
        controls: true,
        width: '100%'
      });
      $previewElement.replaceWith(videoElement);
    }
  };
  reader.onerror = function () {
    $previewElement.attr('src', '/public/img/imageNotFound.png');
  };
  reader.readAsDataURL(file);
},

// Utility: Toggle button loading state
toggleButtonLoading: function($button, isLoading) {
  const spinner = $button.find('.spinner');
  if (isLoading) {
    spinner.show();
    $button.addClass('disabled').prop('disabled', true);
  } else {
    spinner.hide();
    $button.removeClass('disabled').prop('disabled', false);
  }
},
  apiRequest: async function (type, data, onCallback, id) {



    $.ajax(Cafe.apiUrl + `${id || ''}/`, {
      type: type,
      enctype     : "multipart/form-data",
      processData: false, // Important: Do not process data (we're sending FormData)
      contentType: false, // Important: Do not set content type (let the browser set it)
      data: data, // Send the FormData object
      success: function (result,textStatus ,jqXHR) {
        onCallback && onCallback(result ,jqXHR);

      },
      error: function () {
        onCallback && onCallback({ error: 'Xatolik yuz berdi.' });
      }
    });
  },
  eStatusClicked: function() {
    Cafe.hideStatus();
  },
  showStatus: function(text, success) {
    clearTimeout(Cafe.statusTo);

    if (!success) {
      $('.js-status').text(text).removeClass('success').addClass('error').addClass('shown');
    } else {
      $('.js-status').text(text).removeClass('error').addClass('success').addClass('shown');
    }

    if (!Cafe.isClosed) {
      Cafe.statusTo = setTimeout(function() { Cafe.hideStatus(success); }, 2500);
    }
  },

  hideStatus: function(success) {
    clearTimeout(Cafe.statusTo);
    $('.js-status').removeClass('shown success error');
    if (success){
      $('.modal-window').hide();
    }
  },

  chosen : function (){
    const urlParams = new URLSearchParams(window.location.search);

    const itemData = [];

    let itemIds = urlParams.getAll('data-item-id');
    let counts = urlParams.getAll('count');
    let comment = urlParams.get('comment')



    itemIds.forEach((itemId, index) => {
      const itemCount = counts[index];

      if (itemCount) {
        itemData.push({ itemId, itemCount: parseInt(itemCount) });
      }
    });


    itemData.forEach(({ itemId, itemCount }) => {
      const $itemElement = $(`.js-item[data-item-id="${itemId}"]`);

      if ($itemElement.length > 0) {

        let currentCount = +$itemElement.data('item-count') || 0;
        let delta = itemCount - currentCount;
        $itemElement.data('item-count',itemCount)

        Cafe.updateItem($itemElement, delta);

      }else {
        Cafe.showStatus('Kechirasiz ushbu mahsulot bizda mavjud emas!')
      }
    });

    $('.js-order-comment-field').val(comment);

  },
  sIncrClicked: function () {
    let id = $(this).closest(".cafe-order-item").attr('data-item-id')

    let button = $(this).closest(".cafe-order-item").find('.cafe-item-decr-button');
    button.css('cursor', 'pointer');


   let itemEL = $(`.cafe-item[data-item-id="${id}"]`)

    Cafe.incrClicked(itemEL,1)
  },

  sDecrClicked: function () {
    let id = $(this).closest(".cafe-order-item").attr('data-item-id')
    let counter = $(this).closest(".cafe-order-item").find(".js-order-item-counter");
    let currentValue = parseInt(counter.text()) || 0;

    let itemEL = $(`.cafe-item[data-item-id="${id}"]`)

    if (currentValue > 1) {
      Cafe.incrClicked(itemEL,-1)
    }

    let button = $(this).closest(".cafe-order-item").find('.cafe-item-decr-button');
    button.css('cursor', currentValue === 1 ? 'not-allowed' : 'pointer');
  }
};


document.addEventListener("input", function (e) {
  if (e.target.classList.contains("js-order-comment-field")) {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  }
});



export default Cafe
