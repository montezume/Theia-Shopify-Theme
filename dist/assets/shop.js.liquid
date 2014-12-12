window.timber = window.timber || {};

timber.cache = {
    // General
    $html: $('html'),
    $body: $('body'),

    // Navigation
    $navigation: $('#accessibleNav'),

    // Product Page
    productPage: {
        $mainImage: $('#productPhotoImg'),
        $thumbImages: $('#productThumbs').find('a.product-photo-thumb'),
        $newImage: null,
        $mobileHeaderLink: $('#mobileProductHeaderLink'),
        $infoBlock: $('#productInfoBlock'),
        $descriptionToggle: $('#descriptionToggle')
    },

    // Celebrity Gallery
    $celebrityGallery: $('.celebrity-gallery-hero'),
    $celebritySlides: $('.celebrity-gallery .slide'),
    $celebrityThumbs: $('.celebrity-gallery .thumb'),

    // Mobile Slide Out Navigation
    mobileSideNav: {
        $container: $('.container'),
        $toggle: $('#sideNavToggle'),
        $nav: $( '#mobileSideNav' )
    }
};

timber.init = function () {

    // Run on load
    timber.accessibleNav();
    timber.productImageSwitch();
    timber.carouselInit();
    timber.loginFormInit();
    timber.celebrityGallery();
    timber.mobileSideNav();
    timber.mobileProductInfoBlock();
    timber.productDescriptionBlock();
    timber.loader.init();

    // initialize smooth scroll
    smoothScroll.init();
};

timber.switchClass = function( $el, c1, c2){
    if ( $el.hasClass(c1) ) {
        $el.removeClass(c1);
        $el.addClass(c2);
    } else {
        $el.removeClass(c2);
        $el.addClass(c1);
    }
};

timber.productDescriptionBlock = function(){

    var $toggle = timber.cache.productPage.$descriptionToggle,
        $infoBlock = timber.cache.productPage.$infoBlock,
        $icon = $toggle.find('.icon'),
        $content = $infoBlock.find('.content');

    $toggle.click(function(e){
        e.preventDefault();

        $content.scrollTop(0);
        $infoBlock.toggleClass('description-expanded');
        timber.switchClass( $icon, 'up', 'down' );
    });
};

timber.mobileProductInfoBlock = function(){

    var $toggle = timber.cache.productPage.$mobileHeaderLink,
        $icon = $toggle.find('.icon'),
        $infoBlock = timber.cache.productPage.$infoBlock;

    $toggle.click(function(e){
        e.preventDefault();

        // flip the arrow icon
        timber.switchClass( $icon, 'up', 'down' );

        $infoBlock.toggleClass('expanded');
    });
};

timber.mobileSideNav = function(){

    var $container = timber.cache.mobileSideNav.$container,
        $toggle = timber.cache.mobileSideNav.$toggle,
        $nav = timber.cache.mobileSideNav.$nav;

    $toggle.click(function(e) {
        e.preventDefault();
        e.stopPropagation();

        if ( $container.hasClass('menu-open') ){
            timber.mobileSideNav.close();
        } else {
            timber.mobileSideNav.open();
        }
    });

    $container.click(function(e){
        if ( $container.hasClass('menu-open') ){
            timber.mobileSideNav.close();
        }
    });

    this.mobileSideNav.open = function(){
        $container.addClass( 'menu-open' );
        $nav.addClass( 'open' );
    };

    this.mobileSideNav.close = function(){
        $container.removeClass( 'menu-open' );
        $nav.removeClass( 'open' );
    };
};

timber.celebrityGallery = function(){

    // get elements
    var $gallery = timber.cache.$celebrityGallery,
        $slides = timber.cache.$celebritySlides,
        $thumbs = timber.cache.$celebrityThumbs;

    // wire click actions
    $thumbs.click(function(e){
        e.preventDefault();

        var $this = $(this),
            $targetSlide = $( $this.attr('href') ),
            bgColor = $targetSlide.data('bgColor');

        $thumbs.removeClass('active');
        $slides.removeClass('active');

        $this.addClass('active');
        $targetSlide.addClass('active');
        $gallery.css('backgroundColor', bgColor);

    });
};

timber.loginFormInit = function(){

    /*
     Show/hide the recover password form when requested.
     I'd suggest using some CSS3 transitions to make this change look cool,
     but this gets the job done for now.
     */
    function showRecoverPasswordForm(e) {
        if (typeof e !== 'undefined') {
            e.preventDefault();
        }

        $('.recover-password-block').show();
        $('.login-block').hide();
    }

    function hideRecoverPasswordForm(e) {
        e.preventDefault();

        $('.recover-password-block').hide();
        $('.login-block').show();
    }

    // Allow deep linking to the recover password form
    if (window.location.hash == '#recover') {
        showRecoverPasswordForm();
    }

    $('.forgot-passowrd-link').click(showRecoverPasswordForm);
    $('.cancel-forgot-password-link').click(hideRecoverPasswordForm);

    // reset_success is only true when the reset form is
    {% if reset_success %}
    document.getElementById('resetSuccess').style.display = 'block';
    {% endif %}
};

timber.carouselInit = function () {
    $('.carousel').slick({
        dots: true,
        prevArrow: '<a href="#" class="slick-prev"></a>',
        nextArrow: '<a href="#" class="slick-next"></a>',
        customPaging: function(slider, i) {
            return '<a href="#">' + (i + 1) + '</a>';
        }
    });
};

timber.accessibleNav = function () {
    var $nav = timber.cache.$navigation,
        $allLinks = $nav.find('a'),
        $topLevel = $nav.children('li').find('a'),
        $parents = $nav.find('.site-nav--has-dropdown'),
        $subMenuLinks = $nav.find('.site-nav--dropdown').find('a'),
        activeClass = 'nav-hover',
        focusClass = 'nav-focus';

    // Mouseenter
    $parents.on('mouseenter touchstart', function(evt) {
        var $el = $(this);

        if (!$el.hasClass(activeClass)) {
            evt.preventDefault();
        }

        showDropdown($el);
    });

    // Mouseout
    $parents.on('mouseleave', function() {
        hideDropdown($(this));
    });

    $subMenuLinks.on('touchstart', function(evt) {
        // Prevent touchstart on body from firing instead of link
        evt.stopImmediatePropagation();
    });

    $allLinks.focus(function() {
        handleFocus($(this));
    });

    $allLinks.blur(function() {
        removeFocus($topLevel);
    });

    // accessibleNav private methods
    function handleFocus ($el) {
        var $subMenu = $el.next('ul');
        hasSubMenu = $subMenu.hasClass('sub-nav') ? true : false,
        isSubItem = $('.site-nav--dropdown').has($el).length,
        $newFocus = null;

        // Add focus class for top level items, or keep menu shown
        if ( !isSubItem ) {
            removeFocus($topLevel);
            addFocus($el);
        } else {
            $newFocus = $el.closest('.site-nav--has-dropdown').find('a');
            addFocus($newFocus);
        }
    }

    function showDropdown ($el) {
        $el.addClass(activeClass);

        setTimeout(function() {
            timber.cache.$body.on('touchstart', function() {
                hideDropdown($el);
            });
        }, 250);
    }

    function hideDropdown ($el) {
        $el.removeClass(activeClass);
        timber.cache.$body.off('touchstart');
    }

    function addFocus ($el) {
        $el.addClass(focusClass);
    }

    function removeFocus ($el) {
        $el.removeClass(focusClass);
    }
};

timber.productImageSwitch = function () {
    if ( !timber.cache.productPage.$thumbImages.length ) {
        return;
    }

    // Switch the main image with one of the thumbnails
    // Note: this does not change the variant selected, just the image
    timber.cache.productPage.$thumbImages.on('click', function(e) {
        e.preventDefault();
        timber.cache.productPage.$newImage = $(this).attr('href');
        timber.cache.productPage.$mainImage.attr({ src: timber.cache.productPage.$newImage });

        // change the loupe image
        $('.loupe img').attr({ src: timber.cache.productPage.$newImage });
    });
};

timber.loader = {
    element: '',
    selector: '.spinner',

    init: function(){
        // get loader template
        timber.loader.element = $('#loaderAnimationTemplate').html();
    },

    show: function( target ){
        // append the loader element to the target element and show it

        if ( typeof target === 'undefined' ) {
            return;
        }

        $( target ).append( timber.loader.element );
    },

    hide: function( target ){
        // hide the loader element in the target

        if ( typeof target === 'undefined' ) {
            return;
        } else {
            $( target ).hide();
        }
    },

    destroy: function( target ){
        if( typeof target === 'undefined' ){
            // no target element, hide and destroy all loader animations
            return;
        } else {
            // hide and destroy the loader in the target element
            $( target ).remove();
        }
    }
};

// Initialize Timber's JS on docready
$(function() {
    window.timber.init();
});
