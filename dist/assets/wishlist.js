var wishlist = (function($){

    var self = this,
        defaults = {
            addButtonSelector: '#add-to-wishlist-link',
            wrapperSelector: 'wishlist-viewed-products',
            productTemplateSelector: 'wishlist-viewed-product-template'
        },
        settings = {},
        wishlists = [],
        defaultWishlist = {
            products: []
        },
        customer = {},
        currentProduct = {},
        requestCache = {};

    function init(options, customerData, productData){
        console.log('init wishlist');

        settings = $.extend({}, defaults, options);

        // load customer data
        if (settings.customerCheckout === false) {
            customer = {
                id: getGuestId(),
                firstName: '',
                lastName: 'Guest'
            };
        } else {
            customer = customerData;
        }

        if (typeof productData.id !== 'undefined'){
            currentProduct = productData;
        }

        // wishlist link
        if (settings.customerCheckout && customer.id == '') {
            settings.linkWishlist = '/account';
        }

        initEvents();

        // get wishlists from app
        getWishlists().done( loadWishlists );

        // init the add to wishlist link
        initAddButton();
    }

    function initEvents(){

        $(document).on({
            'wishlistsLoaded.wishlist': function(e){
                console.log( 'wishlistsLoaded' );

                getWishlistProducts().done( loadWishlistProducts );
            },
            'singleProductLoaded.wishlist': function(e){
                console.log('singleProductLoaded');

                if ( defaultWishlist.productsToLoad === defaultWishlist.products.length ) {
                    $(document).trigger('allProductsLoaded.wishlist');
                }
            },
            'allProductsLoaded.wishlist': function(e){
                console.log( 'allProductsLoaded' );

                // if we are on the wishlist page.
                if ( $('body#wishlist').length ){
                    renderWishlistTemplate();
                }
            },
            'renderedWishlistTemplate.wishlist': function(e){
                // wire the click events for the products.
                $('.remove-item-link').click( removeProductClickCallback );
            }
        });
    }

    function removeProductClickCallback(e){
        e.preventDefault();

        var productId = $(this).data('productId');

        requestRemoveProduct(productId).done( responseRemoveProduct );
    }

    function requestRemoveProduct(productId){
        // cache the product id of the deleted product
        requestCache.removeProduct = {
            productId: productId
        };

        // the api requires an array of product ids to delete
        var prodIds = [productId];

        var url = settings.appDomain + "deleteproduct?jsoncallback=?",
            data = {
                format: 'json',
                wishlist: defaultWishlist.id,
                product: prodIds,
                customer: customer.id,
                shop: settings.permanentDomain
            };

        return $.getJSON( url, data).done(function(r){
            console.log(r);
        });
    }

    function responseRemoveProduct(r){
        // get the cache data
        var removedProductId = requestCache.removeProduct.productId;
        var removedProduct = defaultWishlist.products.filter(function(e){
            return e.id === removedProductId;
        })[0];

        if (r.status == 200) {
            // success

            // remove the product element from the wishlist
            $( '#product-' + removedProduct.handle ).remove();

            // remove the product from defaultWishlist.products array
            defaultWishlist.products = defaultWishlist.products.filter(function(e){
                return e.id !== removedProduct.id;
            });

            // show user a success message
            alert('product removed');

        } else if (r.status == 300) {
            // fail

            // show user the error
            $('#add-to-cart-msg-wishlist').hide().addClass('success').html(r.message + '<span><a href="#" onclick="closeMessage()">close</a></span>').fadeIn();
        }

        // clear the cache
        requestCache.removedProduct = {};

    }

    function renderWishlistTemplate() {

        timber.loader.destroy( '.wishlist-block .spinner-wrapper' );

        // If we have any to show.
        if ( defaultWishlist.products.length ) {

            var templateSource = jQuery('#' + settings.productTemplateSelector).html(),
                template = Handlebars.compile( templateSource ),
                $wrapper = jQuery('#' + settings.wrapperSelector);

            // Getting each product with an Ajax call and rendering it on the page.
            for (var i=0; i<defaultWishlist.products.length; i++) {
                // Render template with product and append to wrapper.
                $wrapper.append(template(defaultWishlist.products[i]));
            }

        } else {
            $wrapper.html('<p>Products have not been added to this wishlist</p>');
        }

        $(document).trigger('renderedWishlistTemplate.wishlist');
    }

    function getWishlistProducts() {

        var url = settings.appDomain + "getproducts?jsoncallback=?",
            data = {
                format: 'json',
                customer: customer.id,
                category: defaultWishlist.id,
                shop: settings.permanentDomain
            };

        timber.loader.show('.wishlist-block .spinner-wrapper');

        return $.getJSON( url, data ).done(function(r){
            console.log(r);
        });
    };

    function loadWishlistProducts(data) {

        // other statuses are error conditions, no values mean nothing in the wishlist
        if (data.status !== 200 || data.values.length === 0) {
            return;
        }

        // store the number of products to load for checking in the loadProduct callback.
        defaultWishlist.productsToLoad = data.values.length;

        // get the product details for each product in the wishlist.
        $.map( data.values, function(el, i){
            $.getJSON( '/products/' + el.handle + '.js' ).done( loadProduct );
        });
    }

    function loadProduct(product){

        var sixDigits = /^\d{6}$/,
            styleNumber;

        // get style number from tags
        styleNumber = product.tags.filter(function(e){
            return sixDigits.test(e);
        });

        if ( styleNumber.length > 0 ) {
            product.styleNumber = styleNumber[0];
            product.hasStyleNumber = true;
        } else {
            product.hasStyleNumber = false;
        }

        // format price of the first variant.
        product.currency = Shopify.formatMoney(product.variants[0].price, settings.currency);

        product.imageSrc = Shopify.resizeImage((product.featured_image ? product.featured_image : "http://cdn.shopify.com/s/images/admin/no-image-medium.gif"), "medium");

        for (var j=0; j<product.variants.length; j++) {
            product.variants[j].currency = Shopify.formatMoney(product.variants[j].price, settings.currency);
        }

        defaultWishlist.products.push(product);

        $(document).trigger('singleProductLoaded.wishlist');
    }

    function initAddButton(){

        isInWishlist( currentProduct.id ).done(function(data){

            if (data.status === 300){
                currentProduct.isInWishlist = true;
                $(settings.addButtonSelector)
                    .text('In your wishlist')
                    .attr('href', settings.linkWishlist);

            } else {
                currentProduct.isInWishlist = false;
                $(settings.addButtonSelector)
                    .click(addToMainWishlistCallBack);
            }
        });
    }

    function addToMainWishlistCallBack(e){
        e.preventDefault();

        addToMainWishlist();
    }

    function addToMainWishlist(){
        var url = settings.appDomain + "addtowishlist?jsoncallback=?";

        var data = {
            format: 'json',
            category: defaultWishlist.id,
            title: defaultWishlist.name,
            customer: customer.id,
            fn: customer.firstName,
            ln: customer.lastName,
            product: currentProduct.id,
            handle: currentProduct.handle,
            shop: settings.permanentDomain
        };

        return $.getJSON( url, data )
            .done(function(data){
                console.log(data);

                if (data.status === 200){
                    currentProduct.isInWishlist = true;
                    $(settings.addButtonSelector)
                        .text('In your wishlist')
                        .attr('href', settings.linkWishlist)
                        .unbind('click', addToMainWishlistCallBack);
                }
            });
    }

    function isInWishlist( prodId ){
        // simple wrapper function
        // first parameter is type and if set to 0 it will get the 
        // if provided a product id then the server will return
        // a 300 code if the product is already on a wishlist.
        return getWishlists( 0, prodId );
    }

    function getWishlists( type, prodId ){
        var url = settings.appDomain + "getcategories?jsoncallback=?";
        var data = {
                format: 'json',
                customer: customer.id,
                fn: customer.firstName,
                ln: customer.lastName,
                shop: settings.permanentDomain
        };

        if (typeof type !== 'undefined') {
            data.type = type;
        }

        if (typeof prodId !== 'undefined') {
            data.product = prodId;
        }

        return $.getJSON(url, data)
            .done(function(r){
                console.log(r);
            });
    }

    function loadWishlists(data){
        wishlists = parseWishlists( data.value );

        var tmp;
        // get the first matching wishlist with the name "Main"
        tmp  = wishlists.filter(function(el){
            return el.name === 'Main';
        })[0];

        defaultWishlist.name = tmp.name;
        defaultWishlist.id = tmp.id;

        $(document).trigger('wishlistsLoaded.wishlist');
     }

    function parseWishlists( html ){

        // data is returned with a status and an html partial
        // this pulls out the form labels and pulls the data we need.
        var $labels = $(html).find('label');
        var categories = [];

        $labels.each(function( i, e ){
            categories.push({
                id: $(e).attr('for'),
                name: $(e).text()
            });
        });

        return categories;
    }

    // expose public methods and properties
    return {
        init: init,
        settings: function(){ return settings; },
        customer: function(){ return customer; },
        wishlists: function(){ return wishlists; },
        defaultWishlist: function(){ return defaultWishlist; },
        currentProduct: function(){ return currentProduct; }
    };

})(jQuery);



/* Functions */

// Check all checkboxes in list
function checkAll(hand) {
    return jQuery('table.wishlist-products-list').find('input:checkbox.checkbox').attr('checked', jQuery(hand).attr('checked') ? true : false);
}

/** 
 * Ajaxy add-to-cart 
 */
function addToCartWishlist(e){
    var id        = $(e).parents('form').find('input[name="id"]').val();
    var quantity  = $(e).parents('form').find('input[name="quantity"]').val() || 1;
    loading('show');
    $.ajax({ 
        type: 'POST',
        url: '/cart/add.js',
        cache: false, 
        data: 'quantity=' + quantity + '&id=' + id,
        dataType: 'json',
        error: addToCartFailWishlist,
        success: addToCartSuccessWishlist
    }); 
}

function updateCartDesc(data){
    var $cartLinkText = $('.cart-link .icon:first');
    
    switch(data.item_count){
    case 0: 
        $cartLinkText.text('0 items');
        break;
    case 1:
        $cartLinkText.text('1 item');
        break;
    default:
        $cartLinkText.text(data.item_count+' items');
        break;
    }
}

function addToCartSuccessWishlist (jqXHR, textStatus, errorThrown){
    $.ajax({ 
        type: 'GET',
        url: '/cart.js',
        async: false, 
        cache: false, 
        dataType: 'json',
        success: updateCartDesc  
    });
    loading('hide');
    $('#add-to-cart-msg-wishlist').hide().addClass('success').html('Item added to cart! <a href="/cart" title="view cart">View cart and check out &raquo;</a><span style="float: right"><a href="javascript:void(0)" onclick="closeMessage()">close</a></span>').fadeIn();   
}

function closeMessage() {
    $('#add-to-cart-msg-wishlist').hide();
}

function addToCartFailWishlist(jqXHR, textStatus, errorThrown){
    var response = $.parseJSON(jqXHR.responseText);
    loading('hide');
    console.error('PROBLEM ADDING TO CART!', response.description);  
    $('#add-to-cart-msg-wishlist').addClass('error').text(response.description);
}

function loadTabProducts(el) {

    $('div#all-actions').css('display', 'none');
    $('input:checkbox.check-all').attr('checked', false);

    closeMessage();
    loading('show');

    $('div#wishlist-viewed-products').html('<p class="clearfix-button">Loading...</p>');
    $('ul#navlist-wishlist a').attr('id', '');

    $(el).attr('id', 'current');

    $('span.delete-wishlist').css('visibility', 'hidden');

    $('a.' + $(el).attr('class') + ' span').css('visibility', 'visible');

    $.getJSON(
        appDomain + "getproducts?jsoncallback=?", {
            format: 'json',
            customer: userId,
            category: $(el).attr('class'),
            shop: shopPermanentDomain
        },
        function(data) {

            console.log(data);

            $('div#categories').html('');

            loading('hide');

            if (data.status == 200) {

                if (data.values.length) {

                    recentlyViewed = data.values;

                    if (recentlyViewed.length) {

                        $('div#all-actions').css('display', 'block');
                        $('div.copy-move').css('display', 'none');
                        $('div.move-copy-block').empty();
                        createCategorySelectBox('all-items', 'all');

                    }

                    Shopify.Products.showRecentlyViewed( { howManyToShow:recentlyViewed.length } );

                } else {

                    $('div#wishlist-viewed-products').html('<p class="clearfix-button">Products have not been added to this wishlist</p>');

                }
            }
        }
    );
}



/* Functions */

function showModalForm() {
    $('#basic-modal-content').modal({overlayClose:true});
}

function closeModalForm() {
    $.modal.close();
}

function loadCategories(user, object, type) {
    loading('show');
    var categories;

    var json = $.getJSON(
        appDomain + "getcategories?jsoncallback=?",
        {
            format: 'json',
            customer: user,
            fn: customerFN,
            ln: customerLN,
            product: productId,
            shop: shopPermanentDomain,
            type: type
        },
        function(data) {
            object.html('');
            loading('hide');

            if (data.status == 200) {
                object.append(data.value);

                if (!type) {
                    showModalForm();

                } else {
                    $('ul#navlist-wishlist a#current').click();
                    $("span.delete-wishlist").click(function(event){
                        event.stopPropagation();

                        //delete wishlist
                        if (confirm("Do you want to delete this wishlist?")) {
                            deleteWishlist($(this).attr('id'));
	                } else {
	                    return;
	                }
                    });
                }

            } else if (data.status == 300) {
                alert(data.message);
                return;

            } else {
                object.html('Categories not found');
                if (!type) {
                    showModalForm();
                }
            }
        }
    );
}

function deleteSelected(wishlist) {
    var selected = new Array();
    $("input:checkbox.checkbox:checked").each(function() {
        selected.push($(this).val());
    });
    if (selected.length) {
        if (confirm("Do you want to delete selected items?")) {
            deleteProduct(selected, wishlist);
        } else {
            return;
        }
    } else {
        return;
    }
}

function deleteItem(productId, wishlist) {
    //delete Product
    if (confirm("Do you want to delete this product?")) {
        var selected = new Array();
        selected.push(productId);
        deleteProduct(selected, wishlist);
    } else {
        return;
    }
}

function deleteProduct(productId, wishlist) {
    $.getJSON(
        appDomain + "deleteproduct?jsoncallback=?",
        {
            format: 'json',
            wishlist: wishlist.attr('class'),
            product: productId,
            customer: userId,
            shop: shopPermanentDomain
        },
        function(data){
            if (data.status == 200) {
                loadTabProducts(wishlist);
            } else if (data.status == 300) {
                $('p#add-to-cart-msg-wishlist').hide().addClass('success').html(data.message + '<span style="float: right"><a href="javascript:void(0)" onclick="closeMessage()">close</a></span>').fadeIn();
            }
        }
    );
}

function moveSelected(wishlist) {
    var selected = new Array();
    $("input:checkbox.checkbox:checked").each(function() {
        selected.push($(this).val());
    });
    if (selected.length) {
        if (confirm("Do you want to move selected items?")) {
            loading('show');
            $.getJSON(
                appDomain + "moveproduct?jsoncallback=?",
                {
                    format: 'json',
                    wishlist: wishlist.attr('class'),
                    product: selected,
                    customer: userId,
                    shop: shopPermanentDomain,
                    wishlistNew: $('select[id=all-items]').val()
                },
                function(data){
                    if (data.status == 200) {
                        loadTabProducts(wishlist);
                    } else {
                        $('p#add-to-cart-msg-wishlist').hide().addClass('success').html(data.message + '<span style="float: right"><a href="javascript:void(0)" onclick="closeMessage()">close</a></span>').fadeIn();
                        loading('hide');
                    }
                }
            );
        } else {
            return;
        }
    } else {
        return;
    }
}

function move(productId, wishlist) {
    loading('show');
    $.getJSON(
        appDomain + "moveproduct?jsoncallback=?",
        {
            format: 'json',
            wishlist: wishlist.attr('class'),
            product: productId,
            customer: userId,
            shop: shopPermanentDomain,
            wishlistNew: $('select[id='+productId+']').val()
        },
        function(data){
            if (data.status == 200) {
                loadTabProducts(wishlist);
            } else {
                $('p#add-to-cart-msg-wishlist').hide().addClass('success').html(data.message + '<span style="float: right"><a href="javascript:void(0)" onclick="closeMessage()">close</a></span>').fadeIn();
                loading('hide');
            }
        }
    );
}

function copySelected(wishlist) {
    var selected = new Array();
    $("input:checkbox.checkbox:checked").each(function() {
        selected.push($(this).val());
    });
    if (selected.length) {
        if (confirm("Do you want to copy selected items?")) {
            loading('show');
            $.getJSON(
                appDomain + "copyproduct?jsoncallback=?",
                {
                    format: 'json',
                    wishlist: wishlist.attr('class'),
                    product: selected,
                    customer: userId,
                    shop: shopPermanentDomain,
                    wishlistNew: $('select[id=all-items]').val()
                },
                function(data){
                    if (data.status) {
                        $('p#add-to-cart-msg-wishlist').hide().addClass('success').html(data.message + '<span style="float: right"><a href="javascript:void(0)" onclick="closeMessage()">close</a></span>').fadeIn();
                    }
                    loading('hide');
                }
            ); 
        } else {
            return;
        }         
    } else 
        return;
}

function copy(productId, wishlist) {
    loading('show');
    $.getJSON(
        appDomain + "copyproduct?jsoncallback=?",
        {
            format: 'json',
            wishlist: wishlist.attr('class'),
            product: productId,
            customer: userId,
            shop: shopPermanentDomain,
            wishlistNew: $('select[id='+productId+']').val()
        },
        function(data){
            if (data.status) {
                $('p#add-to-cart-msg-wishlist').hide().addClass('success').html(data.message + '<span style="float: right"><a href="javascript:void(0)" onclick="closeMessage()">close</a></span>').fadeIn();
            }
            loading('hide');
        }
    );    
}

function addNote(el, wishlistId){
    loading('show');
    var element = $(el);
    closeMessage();
    $.getJSON(
        appDomain + "addnote?jsoncallback=?",
        {
            format: 'json',
            text: $('#'+element.attr('id')).val(),
            customer: userId,
            product: element.attr('id'),
            wishlist: wishlistId,
            shop: shopPermanentDomain
        },
        function(data){
            if (data.status == 200) {
            } else if (data.status == 300) {
                $('p#add-to-cart-msg-wishlist').hide().addClass('success').html(data.message + '<span style="float: right"><a href="javascript:void(0)" onclick="closeMessage()">close</a></span>').fadeIn();
            }
            loading('hide');
        }
    );
}

function addToWishlist(){
    $.getJSON(
        appDomain + "addtowishlist?jsoncallback=?",
        {
            format: 'json',
            category: $('form.select-form input:checked').val(),
            title: $('input#category-name').val(),
            customer: userId,
            fn: customerFN,
            ln: customerLN,
            product: $('input#productId').val(),
            handle: $('input#productId').attr('class'),
            shop: shopPermanentDomain
        },
        function(data){
            if (data.status == 200) {
                if ( wishlistSettingRedirectUser ) {
                    window.location = '/pages/wishlist';
                } else {
                    closeModalForm();
                    alert('added to wishlist');
                }
            } else if (data.status == 300) {
                $('span#resultMessage').html(data.message);
            }
        }
    );
}

/*Loading Block*/
function loading(type) {
    switch (type) {
    case 'show':
        $('div.wl_loading').show().fadeIn();
        break;
    case 'hide':
        $('div.wl_loading').hide().fadeOut();
        break;
    }
}

function getGuestId(){
    var guestId = $.cookie('questId');

    if (!guestId) {
        var domain = shopPermenantDomain;
        $.getJSON(
            appDomain + "cookie?format=json&shop="+domain+"&jsoncallback=?",
            function(data){
                $.cookie('questId', data.id, { expires: 365*2, path: '/', domain: shopDomain });
                guestId = $.cookie('questId');
            }
        );
    }

    return guestId;
}
