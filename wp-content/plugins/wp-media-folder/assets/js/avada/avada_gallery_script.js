(function ($) {
    $(document).ready(function () {
        function wpmfFusionClickHandle() {
            $(document).on("click", '.fusion-wpmf-gallery-remove-image', function (e) {
                var id = $(this).closest('.wpmf-fusion-image-child').data('id');
                var ids = $('.wpmf_fusion_gallery #items').val();
                ids = ids.split(',');
                var index = ids.indexOf(id);
                if (index === -1) {
                    index = ids.indexOf(id.toString());
                }
                if (index > -1) {
                    ids.splice(index, 1);
                }
                $(this).closest('.wpmf-fusion-image-child').remove();
                $('.wpmf_fusion_gallery #items').val(ids.join()).change();
            });

            $('.wpmf-fusion-images').sortable({
                //placeholder: "sortable-placeholder",
                update: function () {
                    var order = [];
                    $.each($('.wpmf-fusion-image-child'), function (i, val) {
                        var id = $(this).data('id');
                        if (order.indexOf(id) === -1) {
                            order.push(id);
                        }
                    });
                    $('.wpmf_fusion_gallery #items').val(order.join()).change();
                }
            });
            $( ".wpmf-fusion-images" ).disableSelection();
        }
        wpmfFusionClickHandle();
        function wpmf_fusion_gallery_get_images(wrap, params) {
            $.ajax({
                method: "POST",
                dataType: 'json',
                url: (typeof fusionAppConfig.ajaxurl !== "undefined") ? fusionAppConfig.ajaxurl : ajaxurl,
                data: {
                    action: "wpmf_fusion_gallery_get_images",
                    items: params.items
                },
                beforeSend: function () {
                    wrap.find('.wpmf-fusion-images').addClass('wpmf-fusion-loading');
                },
                success: function (res) {
                    wrap.find('.wpmf-fusion-images').removeClass('wpmf-fusion-loading').html(res.html);
                    wpmfFusionClickHandle();
                }
            });
        }

        $(document).on("click", '.wpmf_avada_select_images', function (e) {
            if (typeof frame !== "undefined") {
                frame.open();
                return;
            }

            // Create the media frame.
            var frame = wp.media({
                // Tell the modal to show only images.
                library: {
                    type: 'image'
                },
                multiple: true,
            });

            // When an image is selected, run a callback.
            frame.on('select', function () {
                // Grab the selected attachment.
                var attachments = frame.state().get('selection').toJSON();
                var old_items = $('.wpmf_fusion_gallery #items').val();
                var ids = [];
                old_items = old_items.split(',');
                if (old_items.length !== 0) {
                    ids = old_items;
                }

                $.each(attachments, function (i, v) {
                    if (ids.indexOf(v.id) === -1) {
                        ids.push(v.id);
                    }
                });

                if (!$('.fusion-builder-live').length) {
                    var params = {items: ids.join(), orderby: 'post__in', order: 'ASC'};
                    wpmf_fusion_gallery_get_images($('.wpmf_gallery_select'), params);
                }
                $('.wpmf_fusion_gallery #items').val(ids.join()).change();
            });

            frame.open();
        });

        var wpmfElementSettingsView = FusionPageBuilder.ElementSettingsView;
        FusionPageBuilder.ElementSettingsView = FusionPageBuilder.ElementSettingsView.extend({
            /**
             * Renders the view.
             *
             * @since 2.0.0
             * @return {Object} this
             */
            render: function () {
                wpmfElementSettingsView.prototype.render.apply(this, arguments);
                var element_type = this.model.attributes.element_type;
                var params = this.model.attributes.params;
                var wrap = this.$el;
                if (element_type === 'wpmf_fusion_gallery' && params.items !== '') {
                    wpmf_fusion_gallery_get_images(wrap, params);
                }

                return this;
            },

            optionChanged: function(event) {
                wpmfElementSettingsView.prototype.optionChanged.apply(this, arguments);
                var wrap = this.$el;
                var element_type = this.model.attributes.element_type;
                var params = this.model.attributes.params;
                var $target    = jQuery( event.target ),
                    $option    = $target.closest( '.fusion-builder-option' ),
                    paramName;
                paramName  = this.getParamName( $target, $option );
                if (element_type === 'wpmf_fusion_gallery') {
                    if (paramName === 'items' || paramName === 'orderby' || paramName === 'order' ) {
                        wpmf_fusion_gallery_get_images(wrap, params);
                    }
                }
            }
        });
    });
}(jQuery));