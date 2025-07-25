(function ($) {
    "use strict";

    var body = $('body'),
        _window = $(window);

    /**
     * get column width, gutter width, count columns
     * @param $container
     * @returns {{columnWidth: number, gutterWidth, columns: Number}}
     */
    var calculateGrid = function ($container) {
        var columns = parseInt($container.data('wpmfcolumns'));
        var gutterWidth = $container.data('gutterWidth');
        var containerWidth = $container.width();

        if (isNaN(gutterWidth)) {
            gutterWidth = 5;
        } else if (gutterWidth > 500 || gutterWidth < 0) {
            gutterWidth = 5;
        }

        gutterWidth = parseInt(gutterWidth);
        if (parseInt(columns) > 2 && containerWidth <= 450) {
            columns = 2;
        } else if (parseInt(columns) > 4 && containerWidth <= 1024) {
            columns = 4;
        }

        var allGutters = gutterWidth * (columns - 1);
        var contentWidth = containerWidth - allGutters;

        var columnWidth = Math.floor(contentWidth / columns);

        return {columnWidth: columnWidth, gutterWidth: gutterWidth, columns: columns};
    };

    /**
     * Run masonry gallery
     * @param duration
     * @param $container
     */
    var runMasonry = function (duration, $container) {
        var $postBox = $container.children('.wpmf-gallery-item');
        var o = calculateGrid($container);
        $postBox.css({'width': o.columnWidth + 'px', 'margin-bottom': o.gutterWidth + 'px'});
        $container.masonry({
            itemSelector: '.wpmf-gallery-item',
            columnWidth: o.columnWidth,
            gutter: o.gutterWidth,
            isAnimated: true,
            animationOptions: {
                duration: duration,
                easing: 'linear',
                queue: false
            },
            isFitWidth: true
        });

        if ($($container).hasClass('gallery-portfolio')) {
            var w = $($container).find('.attachment-thumbnail').width();
            $($container).find('.wpmf-caption-text.wpmf-gallery-caption , .wpmf-gallery-icon').css('max-width', w + 'px');
        }

        $container.find('.wpmf-gallery-item').css('opacity', 1);
    };

    var wpmfCallPopup = function () {
        /* check Enable the gallery lightbox feature option */
        $('.wpmf-gallerys-life .wpmf-gallery-icon a, .portfolio_lightbox, .wpmf_overlay').each(function () {
            var href = $(this).data('href');
            if (typeof href !== "undefined" && href !== '') {
                $(this).attr('href', href);
            }
        });
        if (typeof wpmfggr !== "undefined" && typeof wpmfggr.wpmf_lightbox_gallery !== "undefined" && parseInt(wpmfggr.wpmf_lightbox_gallery) === 1) {
            if ($().magnificPopup) {
                $('.wpmf-gallerys-life').each(function (i, wrap) {
                    var items = [];
                    $(wrap).find('.wpmf-gallery-icon a[data-lightbox="1"]:not(.portfolio_lightbox, .wpmf_overlay)').each(function (j, item) {
                        var href = $(this).attr('href');
                        var title = $(this).attr('title');
                        if (typeof $(wrap).data('items') !== "undefined") {
                            items = $(wrap).data('items');
                        } else {
                            if ($(item).hasClass('isvideo')) {
                                items.push({src: href, title: title, type: 'iframe'});
                            } else {
                                items.push({src: href, title: title, type: 'image'});
                            }
                        }
                    });

                    $(wrap).find('.wpmf-gallery-icon').on('click', function (e) {
                        if ($(this).find('a[data-lightbox="1"]').length) {
                            e.preventDefault();
                            var index = $(this).find('a[data-lightbox="1"]').data('index');
                            var item = (items[index]);
                            if (item['src'] !== "undefined") {
                                var check_video_kaltura = item['src'].indexOf("cdnapisec.kaltura.com");
                                if (check_video_kaltura !== "undefined" && check_video_kaltura > 0) {
                                    $('.mfp-iframe-holder .mfp-content').css('max-width', '640px');
                                }
                            }
                            $.magnificPopup.open({
                                items: items,
                                gallery: {
                                    enabled: true,
                                    tCounter: '<span class="mfp-counter">%curr% / %total%</span>',
                                    arrowMarkup: '<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"></button>'
                                },
                                showCloseBtn: true,
                                removalDelay: 300,
                                mainClass: 'wpmf-mfp-zoom-in',
                                callbacks: {
                                    open: function (e) {
                                        //overwrite default prev + next function. Add timeout for css3 crossfade animation
                                        $.magnificPopup.instance.next = function () {
                                            var self = this;
                                            self.wrap.removeClass('mfp-image-loaded');
                                            setTimeout(function () {
                                                $.magnificPopup.proto.next.call(self);
                                            }, 120);
                                        };
                                        $.magnificPopup.instance.prev = function () {
                                            var self = this;
                                            self.wrap.removeClass('mfp-image-loaded');
                                            setTimeout(function () {
                                                $.magnificPopup.proto.prev.call(self);
                                            }, 120);
                                        };
                                    },
                                    imageLoadComplete: function () {
                                        var self = this;
                                        setTimeout(function () {
                                            self.wrap.addClass('mfp-image-loaded');
                                        }, 16);
                                    }
                                }
                            });
                            $.magnificPopup.instance.goTo(index);
                        }
                    });
                });
            }
        }
    };

    /**
     * Init gallery
     */
    var initGallery = function (action = '') {
        $('.gallery_life.gallery-masonry').each(function () {
            var $container = $(this);

            if ($container.is(':hidden')) {
                return;
            }

            if ($container.hasClass('masonry')) {
                if (action === 'resize') {
                    $container.masonry('destroy');
                } else {
                    return;
                }
            }

            if (typeof wpmfggr !== "undefined" && wpmfggr.smush_lazyload && !$container.closest('.dd-popup-c').length) {
                $(document).on('lazyloaded', function (e) {
                    imagesLoaded($container, function () {
                        runMasonry(0, $container);
                        $container.css('visibility', 'visible');
                        wpmfCallPopup();
                    });
                });
            } else {
                if (!$container.find('.wpmf_loader_gallery').length) {
                    $container.prepend('<img class="wpmf_loader_gallery" src="' + wpmfggr.img_url + 'balls.gif' + '">');
                }
                imagesLoaded($container, function () {
                    $container.find('.wpmf_loader_gallery').hide();
                    runMasonry(0, $container);
                    $container.css('visibility', 'visible');
                    wpmfCallPopup();
                });
            }
        });

        wpmfCallPopup();
        $(window).on('load', function () {
            /* fix height for slide theme when load */
            $('.flex-viewport').each(function () {
                $(this).css('height', '10px !important');
            })
        });

        /* init slider theme */
        if (jQuery().slick) {
            $('.wpmfslick_life').each(function () {
                var $this = $(this);
                var id = $this.data('id');
                if ($this.is(':hidden')) {
                    return;
                }

                if ($this.hasClass('slick-initialized') || $this.hasClass('wpmfslick_addon')) {
                    return;
                }
                var columns = parseInt($this.data('wpmfcolumns'));
                var container_width = $this.width();
                if (parseInt(columns) >= 4 && container_width <= 450) {
                    columns = 2;
                }

                var auto_animation = parseInt($this.data('auto_animation'));
                var duration = parseInt($this.data('duration'));
                imagesLoaded($('#' + id), function () {
                    var slick_args = {
                        infinite: true,
                        slidesToShow: parseInt(columns),
                        slidesToScroll: parseInt(columns),
                        pauseOnHover: true,
                        autoplay: (auto_animation === 1),
                        adaptiveHeight: (parseInt(columns) === 1),
                        autoplaySpeed: parseInt(duration),
                        rows: 1,
                        dots: (parseInt(columns) > 1),
                        fade: (typeof wpmfggr !== "undefined" && wpmfggr.slider_animation === 'fade' && parseInt(columns) === 1),
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

                    if (!$('#' + id).hasClass('slick-initialized')) {
                        $('#' + id).slick(slick_args);
                    }

                    wpmfCallPopup();
                });
            });
        }
    };

    $(document).ready(function () {
        if (typeof wpmfggr !== "undefined" && wpmfggr.wpmf_current_theme === 'Gleam' || wpmfggr.wpmf_current_theme === 'Betheme') {
            setTimeout(function () {
                initGallery();
            }, 1000);
        } else {
            setTimeout(function () {
                initGallery();
            }, 500);
        }

        /*$(window).on('resize', function () {
            initGallery('resize');
        });*/

        jQuery('.vc_tta-tab').on('click', function () {
            var id = jQuery(this).data('vc-target-model-id');
            if (typeof id === "undefined") {
                id = jQuery(this).find('a').attr('href');
                if (typeof id !== "undefined") {
                    setTimeout(function () {
                        var bodyContainers = jQuery('.vc_tta-panel' + id);
                        if (bodyContainers.find('.wpmf-gallerys').length) {
                            initGallery();
                        }
                    }, 200);
                }
            } else {
                setTimeout(function () {
                    var bodyContainers = jQuery('.vc_tta-panel[data-model-id="' + id + '"]');
                    if (bodyContainers.find('.wpmf-gallerys').length) {
                        initGallery();
                    }
                }, 200);
            }
        });

        $('.pp-tabs-labels .pp-tabs-label').on('click', function () {
            initGallery();
        });

        // click to tab of advanced tab Blocks
        $('.advgb-tab').on('click', function (event) {
            event.preventDefault();
            var bodyContainers = $(this).closest('.advgb-tabs-wrapper').find('.advgb-tab-body-container');
            setTimeout(function () {
                var currentTabActive = $(event.target).closest('.advgb-tab');
                var href = currentTabActive.find('a').attr('href');
                if (bodyContainers.find('.advgb-tab-body[aria-labelledby="' + href.replace(/^#/, "") + '"] .wpmf-gallerys').length) {
                    initGallery();
                }
            }, 200);
        });

        // click to tab of Kadence Blocks
        $('.kt-tabs-title-list .kt-title-item').on('click', function (event) {
            event.preventDefault();
            var href = $(this).attr('id');
            var bodyContainers = $(this).closest('.kt-tabs-wrap').find('.kt-tabs-content-wrap');
            setTimeout(function () {
                if (bodyContainers.find('.kt-tab-inner-content[aria-labelledby="' + href + '"] .wpmf-gallerys').length) {
                    initGallery();
                }
            }, 200);
        });

        // click to Divi tab
        $('.et_pb_tabs_controls li').on('click', function () {
            var cl = $(this).attr('class');
            cl = cl.replace(' et_pb_tab_active', '');
            var bodyContainers = $(this).closest('.et_pb_tabs');
            setTimeout(function () {
                if (bodyContainers.find('.et_pb_tab.'+ cl +' .wpmf-gallerys').length) {
                    initGallery();
                }
            }, 800);
        });

        // click to tab of Ultimate Blocks
        $('.wp-block-ub-tabbed-content-tab-title-wrap').on('click', function () {
            setTimeout(function () {
                var bodyContainers = $('.wp-block-ub-tabbed-content-tab-content-wrap.active');
                if (bodyContainers.find('.wpmf-gallerys').length) {
                    initGallery();
                }
            }, 200);
        });

        $('.plgs-archive-menu__item').on('click', function () {
            var id = $(this).data('item-id');
            setTimeout(function () {
                var bodyContainers = $('.plgs-archive-item-wrapper[data-item-id="' + id + '"]');
                if (bodyContainers.find('.wpmf-gallerys').length) {
                    initGallery();
                }
            }, 200);
        });

        $('.accordion .panel-title a[aria-expanded="false"]').on('click', function () {
            var id = $(this).attr('href');
            setTimeout(function () {
                var bodyContainers = $(id);
                if (bodyContainers.find('.wpmf-gallerys').length) {
                    initGallery();
                }
            }, 200);
        });

        $('.elementor-tab-title').on('click', function () {
            var id = $(this).attr('aria-controls');
            setTimeout(function () {
                var bodyContainers = $('#' + id);
                if (bodyContainers.find('.wpmf-gallerys').length) {
                    initGallery();
                }
            }, 200);
        });

        $('.dd-modal').on('click', function () {
            var myInterval = setInterval(function () {
                var bodyContainers = $('.dd-popup-c.open');
                if (bodyContainers.find('.wpmf-gallerys').length) {
                    initGallery();
                    clearInterval(myInterval);
                }
            }, 500);
        });

        $('.plgs-archive-menu__options').on('change', function () {
            var id = $(this).val();
            setTimeout(function () {
                var bodyContainers = $('.plgs-archive-item-wrapper[data-item-id="' + id + '"]');
                if (bodyContainers.find('.wpmf-gallerys').length) {
                    initGallery();
                }
            }, 200);
        });
    });

    $(document).on('fusion-element-render-fusion_tab fusion-element-render-fusion_tabs fusion-element-render-fusion_toggle fusion-element-render-fusion_tagline_box fusion-element-render-fusion_text', function ($, cid) {
        if (jQuery('div[data-cid="' + cid + '"]').find('.wpmf-gallerys').length) {
            initGallery();
        }
    });

    $(document.body).on('post-load', function () {
        initGallery();
    });

    $(document.body).on('wpmfs-toggled', function () {
        initGallery();
    });

})(jQuery);
