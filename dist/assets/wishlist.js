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

    function createWishlist(title){
        closeMessage();
        $.getJSON(
            appDomain + "createwishlist?jsoncallback=?",
            {
                format: 'json',
                title: title,
                customer: userId,
                fn: customerFN,
                ln: customerLN,
                shop: shopPermanentDomain
            },
            function(data){
                if (data.status == 200) {
                    loadCategories(userId, $('div#nav-wishlist'), 1);
                } else if (data.status == 300) {
                    $('p#add-to-cart-msg-wishlist').hide().addClass('success').html(data.message + '<span style="float: right"><a href="javascript:void(0)" onclick="closeMessage()">close</a></span>').fadeIn();
                }
            }
        );
    }

    function deleteWishlist(wishlistId) {
        $.getJSON(
            appDomain + "deletewishlist?jsoncallback=?",
            {
                format: 'json',
                wishlist: wishlistId,
                customer: userId,
                shop: shopPermanentDomain
            },
            function(data){
                if (data.status == 200) {
                    loadCategories(userId, $('div#nav-wishlist'), 1);
                } else if (data.status == 300) {
                    $('p#add-to-cart-msg-wishlist').hide().addClass('success').html(data.message + '<span style="float: right"><a href="javascript:void(0)" onclick="closeMessage()">close</a></span>').fadeIn();
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
        } else 
        return;
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
        } else 
        return;
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
