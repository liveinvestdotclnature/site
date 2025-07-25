/* global fusionAppConfig, FusionPageBuilderViewManager, imagesLoaded */
/* jshint -W098 */
/* eslint no-unused-vars: 0 */
var FusionPageBuilder = FusionPageBuilder || {};

(function () {
    /**
     * run masonry layout
     */
    function wpmfAvadaInitSlider($container, params) {
        //$container.imagesLoaded(function () {
            var slick_args = {
                infinite: true,
                slidesToShow: parseInt(params.columns),
                slidesToScroll: parseInt(params.columns),
                pauseOnHover: false,
                adaptiveHeight: (parseInt(columns) === 1),
                autoplay: false,
                autoplaySpeed: 5000,
                rows: 1,
                dots: true,
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
        //});
    }

    function wpmfAvadaInitMasonry($container) {
        var $grid = $container.isotope({
            itemSelector: '.wpmf-gallery-item',
            percentPosition: true,
            layoutMode: 'packery',
            resizable: true,
            initLayout: true
        });

        // layout Isotope after each image loads
        $grid.find('.wpmf-gallery-item').imagesLoaded().progress( function() {
            setTimeout(function () {
                $grid.isotope('layout');
                $grid.find('.wpmf-gallery-item').addClass('masonry-brick');
            },200);
        });
    }

    jQuery(document).ready(function ($) {
        FusionPageBuilder.wpmf_avada_pdf_embed = FusionPageBuilder.ElementView.extend({
            onRender: function () {
                this.afterPatch();
            },

            afterPatch: function() {
                var container = this.$el;
                var element_type = this.model.attributes.element_type;
                var params = this.model.attributes.params;
            }
        });

        FusionPageBuilder.wpmf_fusion_gallery = FusionPageBuilder.ElementView.extend({
            onRender: function () {
                this.afterPatch();
            },

            beforePatch: function() {
                var container = this.$el;
                var masonry_container = container.find('.wpmf-gallerys');
                masonry_container.remove();
            },

            afterPatch: function() {
                var container = this.$el;
                var params = this.model.attributes.params;
                if (params.items !== '' || (params.gallery_folders === 'yes' && parseInt(params.gallery_folder_id) !== 0)) {
                    var masonry_container = container.find('.gallery-masonry');
                    if (masonry_container.length) {
                        if (masonry_container.find('.wpmf-gallery-item').length) {
                            wpmfAvadaInitMasonry(masonry_container);
                        }
                    }

                    var a = setInterval(function () {
                        var slider_container = container.find('.wpmfslick');
                        if (slider_container.length) {
                            wpmfAvadaInitSlider(slider_container, params);
                            clearInterval(a);
                        }
                    }, 200);
                }
            }
        });
    });
}(jQuery));
