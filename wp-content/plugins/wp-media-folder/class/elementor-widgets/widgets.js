(function ($) {
    $(document).ready(function () {
        /**
         * Open select logo watermark
         */
        $(document).on("click", '.elementor-control-wpmf_add_pdf .elementor-button-default', function (e) {
            if (typeof frame !== "undefined") {
                frame.open();
                return;
            }

            // Create the media frame.
            var frame = wp.media({
                // Tell the modal to show only images.
                library: {
                    type: 'application/pdf'
                }
            });

            frame.on('open',function() {
                var selection = frame.state().get('selection');
                var selected = $('.elementor-control-wpmf_pdf_id input[data-setting="wpmf_pdf_id"]').val(); // the id of the image
                if (selected && selected !== '') {
                    selection.add(wp.media.attachment(selected));
                }
            });

            frame.on('select', function () {
                // Grab the selected attachment.
                var attachment = frame.state().get('selection').first().toJSON();
                $('.elementor-control-wpmf_pdf_id input[data-setting="wpmf_pdf_id"]').val(attachment.id).trigger('input');
            });

            frame.open();
        });

        $(document).on("click", '.elementor-control-wpmf_add_file_design .elementor-button-default', function (e) {
            if (typeof frame !== "undefined") {
                frame.open();
                return;
            }

            // Create the media frame.
            var frame = wp.media({
                library: {
                    type: '*'
                }
            });

            frame.on('open',function() {
                var selection = frame.state().get('selection');
                var selected = $('.elementor-control-wpmf_file_design_id input[data-setting="wpmf_file_design_id"]').val(); // the id of the image
                if (selected && selected !== '') {
                    selection.add(wp.media.attachment(selected));
                }
            });

            frame.on('select', function () {
                // Grab the selected attachment.
                var attachment = frame.state().get('selection').first().toJSON();
                $('.elementor-control-wpmf_file_design_id input[data-setting="wpmf_file_design_id"]').val(attachment.id).trigger('input');
            });

            frame.open();
        });
    });
})(jQuery);