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

                // run option selectors for each of the products in the wishlist
                $.each( defaultWishlist.products, function(i, product){

                    // get the option selector ID for passing to the OptionSelector constructor
                    var currentOptionSelectId = 'productSelect-' + product.id,
                        // find the wishlist element associated with the current wishlist product.
                        wishlistItem = $('#' + currentOptionSelectId).parents('.wishlist-item');

                    new Shopify.OptionSelectors( currentOptionSelectId, {
                        product: product,
                        onVariantSelected: wishlistSelectCallback
                    });

                    // Add label if only one product option and it isn't 'Title'. Could be 'Size'.
                    if ( product.options.length === 1 && product.options[0] !== 'Title' ){
                        wishlistItem.find('.selector-wrapper:eq(0)').prepend('<label>' + product.options[0] + '</label>');
                    }

                    // Hide selectors if we only have 1 variant and its title contains 'Default'.
                    if ( product.variants.length === 1 && product.variants[0].title.indexOf('Default') > -1 ) {
                        $('.selector-wrapper').hide();
                    }

                    // Auto-select first available variant on page load. Otherwise the product looks sold out.
                    $.each( product.variants, function(j, variant){
                        if ( variant.available ){
                            $.each( product.options, function( j, option ){
                                var optionSelector = wishlistItem.find('.single-option-selector:eq(' + j + ')');
                                optionSelector.val( variant.options[j] ).trigger('change');
                            });

                            // return from $.each() early once we select the first available variant
                            return false;
                        }
                        return true;
                    });
                });

                // refresh the selectors for the ajaxify cart plugin.
                ajaxifyShopify.selectDOMElements();
                // override the default add to cart actions for each wishlist item.
                ajaxifyShopify.formOverride();
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
        $.each( data.values, function(i, el){
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

        // format the product options so that Shopify product_options.js works.
        product.options = $.map( product.options, function(el, i){
            return el.name;
        });

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
                    .text('View in your wishlist')
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

    function wishlistSelectCallback(variant, selector) {

        var wishlistItem = $(selector.variantIdField).parents('.wishlist-item'),
            addToCart = wishlistItem.find('.add-to-cart-button'),
            productPrice = wishlistItem.find('.price');

        if (variant) {
            if (variant.available) {
                // We have a valid product variant, so enable the submit button
                addToCart.removeClass('disabled').prop('disabled', false);
                addToCart.find('.label').text('Add to Cart');

            } else {
                // Variant is sold out, disable the submit button
                addToCart.addClass('disabled').prop('disabled', true);
                addToCart.find('.label').text('Sold out');
            }

            // Regardless of stock, update the product price
            productPrice.html(Shopify.formatMoney(variant.price, settings.money_format));

        } else {
            // The variant doesn't exist, disable submit button.
            // This may be an error or notice that a specific variant is not available.
            // To only show available variants, implement linked product options:
            //   - http://docs.shopify.com/manual/configuration/store-customization/advanced-navigation/linked-product-options
            addToCart.val('Unavailable').addClass('disabled').prop('disabled', true);
        }
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
