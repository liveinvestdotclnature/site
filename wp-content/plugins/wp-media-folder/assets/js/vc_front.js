(function ($) {
    'use strict';
    /**
     * run masonry layout
     */
    function wpmfVcInitSlider($container) {
        var columns = parseInt($container.data('wpmfcolumns'));
        var autoplay = $container.data('auto_animation');

        if ($container.is(':hidden')) {
            return;
        }

        if ($container.hasClass('slick-initialized')) {
            $container.slick('unslick');
        }

        $container.imagesLoaded(function () {
            var slick_args = {
                infinite: true,
                slidesToShow: columns,
                slidesToScroll: columns,
                pauseOnHover: false,
                autoplay: (parseInt(autoplay) === 1),
                adaptiveHeight: (parseInt(columns) === 1),
                autoplaySpeed: 5000,
                rows: 1,
                responsive: [
                    {
                        breakpoint: 1024,
                        settings: {
                            slidesToShow: 3,
                            slidesToScroll: 3,
                            infinite: true,
                            dots: true
                        }
                    },
                    {
                        breakpoint: 600,
                        settings: {
                            slidesToShow: 2,
                            slidesToScroll: 2
                        }
                    },
                    {
                        breakpoint: 480,
                        settings: {
                            slidesToShow: 1,
                            slidesToScroll: 1
                        }
                    }
                ]
            };

            if (!$container.hasClass('slick-initialized')) {
                setTimeout(function () {
                    $container.slick(slick_args);
                }, 120);
            }
        });
    }

    function wpmfVcInitMasonry($container) {
        var layout = $container.closest('.wpmf-gallerys-addon').data('layout');
        var padding = $container.data('gutter-width');
        if ($container.hasClass('masonry')) {
            $container.masonry('destroy');
        }

        if ($container.hasClass('justified-gallery')) {
            $container.justifiedGallery('destroy');
        }

        if (layout === 'horizontal') {
            var row_height = $container.closest('.wpmf-gallerys-addon').data('row_height');
            if (typeof row_height === "undefined" || row_height === '') {
                row_height = 200;
            }
            $container.imagesLoaded(function () {
                setTimeout(function () {
                    $container.justifiedGallery({
                        rowHeight: row_height,
                        margins: padding
                    });
                },200);
            });
            return;
        }

        $container.imagesLoaded(function () {
            var $postBox = $container.children('.wpmf-gallery-item');
            var o = wpmfVcCalculateGrid($container);
            $postBox.css({'width': o.columnWidth + 'px', 'margin-bottom': o.gutterWidth + 'px'});
            $container.masonry({
                itemSelector: '.wpmf-gallery-item',
                columnWidth: o.columnWidth,
                gutter: o.gutterWidth,
                transitionDuration: 400
            });
            $container.css('visibility', 'visible');
            $container.find('.wpmf-gallery-item').addClass('wpmf-gallery-item-show');
        });
    }

    function wpmfVcInitFlowsSlide($container) {
        $container.imagesLoaded(function () {
            var enableNavButtons = $container.data('button');
            if (typeof enableNavButtons !== "undefined" && parseInt(enableNavButtons) === 1) {
                $container.flipster({
                    style: 'coverflow',
                    buttons: 'custom',
                    spacing: 0,
                    loop: true,
                    autoplay: 5000,
                    buttonNext: '<i class="flipto-next material-icons"> keyboard_arrow_right </i>',
                    buttonPrev: '<i class="flipto-prev material-icons"> keyboard_arrow_left </i>',
                    onItemSwitch: function (currentItem, previousItem) {
                        $container.find('.flipster__container').height(jQuery(currentItem).height());
                    },
                    onItemStart: function (currentItem) {
                        $container.find('.flipster__container').height(jQuery(currentItem).height());
                    }
                });
            } else {
                $container.flipster({
                    style: 'coverflow',
                    spacing: 0,
                    loop: true,
                    autoplay: 5000,
                    onItemSwitch: function (currentItem, previousItem) {
                        $container.find('.flipster__container').height(jQuery(currentItem).height());
                    },
                    onItemStart: function (currentItem) {
                        $container.find('.flipster__container').height(jQuery(currentItem).height());
                    }
                });
            }
        });
    }

    function wpmfVcInitCustomGrid($container) {
        $container.imagesLoaded(function () {
            var gutter = $container.data('gutter');
            $container.closest('.wpmf_gallery_wrap').find('.loading_gallery').hide();
            var wrap_width = $container.width();
            var one_col_width = (wrap_width - gutter*12)/12;
            $container.find('.grid-item').each(function() {
                var dimensions = jQuery(this).data('styles');
                var w = (typeof dimensions.width !== "undefined") ? parseInt(dimensions.width) : 2;
                var h = (typeof dimensions.height !== "undefined") ? parseInt(dimensions.height) : 2;
                var g = (parseInt(w) - 1)*gutter;
                var display_width = one_col_width;
                var display_height = one_col_width;

                if (w > 1) {
                    display_width = one_col_width*w + g;
                }

                if (w == h) {
                    display_height = display_width;
                } else {
                    if (h > 1) {
                        display_height = (one_col_width*h) + (h - 1)*gutter;
                    }
                }

                jQuery(this).width(display_width);
                jQuery(this).height(display_height);
            });

            $container.isotope({
                itemSelector: '.grid-item',
                layoutMode: 'packery',
                resizable: true,
                initLayout: true,
                packery: {
                    gutter: gutter
                }
            });
            $container.addClass('wpmfInitPackery');
        });
    }

    function wpmfVcCalculateGrid($container) {
        let columns = parseInt($container.data('wpmfcolumns'));
        let gutterWidth = $container.data('gutterWidth');
        let containerWidth = $container.width();

        if (isNaN(gutterWidth)) {
            gutterWidth = 5;
        } else if (gutterWidth > 500 || gutterWidth < 0) {
            gutterWidth = 5;
        }

        if (parseInt(columns) < 2 || containerWidth <= 450) {
            columns = 2;
        }

        gutterWidth = parseInt(gutterWidth);

        let allGutters = gutterWidth * (columns - 1);
        let contentWidth = containerWidth - allGutters;

        let columnWidth = Math.floor(contentWidth / columns);

        return {columnWidth: columnWidth, gutterWidth: gutterWidth, columns: columns};
    }

    // gallery detect render
    window.InlineShortcodeView_vc_wpmf_gallery = window.InlineShortcodeView.extend( {
        render: function () {
            //var model_id = this.model.get( 'id' );
            window.InlineShortcodeView_vc_wpmf_gallery.__super__.render.call( this );
            var masonry_container = jQuery(this.el).find('.gallery-masonry');
            var tab_container;
            if (masonry_container.length) {
                tab_container = masonry_container.closest('.vc_tta-panel');
                if (tab_container.length) {
                    if (tab_container.hasClass('vc_active')) {
                        wpmfVcInitMasonry(masonry_container);
                    }
                } else {
                    wpmfVcInitMasonry(masonry_container);
                }
            }

            var slider_container = jQuery(this.el).find('.wpmfslick');
            if (slider_container.length) {
                tab_container = slider_container.closest('.vc_tta-panel');
                if (tab_container.length) {
                    if (tab_container.hasClass('vc_active')) {
                        wpmfVcInitSlider(slider_container);
                    }
                } else {
                    wpmfVcInitSlider(slider_container);
                }
            }
            return this;
        }
    });

    // gallery addon detect render
    window.InlineShortcodeView_vc_wpmf_gallery_addon = window.InlineShortcodeView.extend( {
        render: function () {
            window.InlineShortcodeView_vc_wpmf_gallery_addon.__super__.render.call( this );
            jQuery(this.el).find('.loading_gallery').hide();
            var masonry_container = jQuery(this.el).find('.gallery-masonry');
            var tab_container;
            if (masonry_container.length) {
                tab_container = masonry_container.closest('.vc_tta-panel');
                if (tab_container.length) {
                    if (tab_container.hasClass('vc_active')) {
                        wpmfVcInitMasonry(masonry_container);
                    }
                } else {
                    wpmfVcInitMasonry(masonry_container);
                }
            }

            var slider_container = jQuery(this.el).find('.wpmfslick');
            if (slider_container.length) {
                tab_container = slider_container.closest('.vc_tta-panel');
                if (tab_container.length) {
                    if (tab_container.hasClass('vc_active')) {
                        wpmfVcInitSlider(slider_container);
                    }
                } else {
                    wpmfVcInitSlider(slider_container);
                }
            }

            var flowslide_container = jQuery(this.el).find('.flipster');
            if (flowslide_container.length) {
                tab_container = flowslide_container.closest('.vc_tta-panel');
                if (tab_container.length) {
                    if (tab_container.hasClass('vc_active')) {
                        wpmfVcInitFlowsSlide(flowslide_container);
                    }
                } else {
                    wpmfVcInitFlowsSlide(flowslide_container);
                }
            }

            var custom_grid_container = jQuery(this.el).find('.wpmf-custom-grid');
            if (custom_grid_container.length) {
                tab_container = custom_grid_container.closest('.vc_tta-panel');
                if (tab_container.length) {
                    if (tab_container.hasClass('vc_active')) {
                        wpmfVcInitCustomGrid(custom_grid_container);
                    }
                } else {
                    wpmfVcInitCustomGrid(custom_grid_container);
                }
            }
            return this;
        }
    });

    // pdf embed detect render
    window.InlineShortcodeView_vc_pdf_embed = window.InlineShortcodeView.extend( {
        render: function () {
            window.InlineShortcodeView_vc_pdf_embed.__super__.render.call( this );
            return this;
        }
    });
})();
