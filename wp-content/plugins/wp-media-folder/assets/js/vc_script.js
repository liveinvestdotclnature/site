(function ($) {
    $(document).ready(function () {
        $(document).on("click", '.wpmf_vc_select_pdf', function (e) {
            if (typeof frame !== "undefined") {
                frame.open();
                return;
            }

            // Create the media frame.
            var frame = wp.media({
                library: {
                    type: 'application/pdf'
                }
            });

            // When an image is selected, run a callback.
            frame.on('select', function () {
                // Grab the selected attachment.
                var attachment = frame.state().get('selection').first().toJSON();
                $('.pdfembed_url_field').val(attachment.url);
                $('.vc_param-name-id').val(attachment.id);
            });

            frame.open();
        });

        $(document).on("click", '.wpmf_vc_select_file', function (e) {
            if (typeof frame !== "undefined") {
                frame.open();
                return;
            }

            // Create the media frame.
            var frame = wp.media({
                // Tell the modal to show only images.
                library: {
                    type: '*'
                }
            });

            // When an image is selected, run a callback.
            frame.on('select', function () {
                // Grab the selected attachment.
                var attachment = frame.state().get('selection').first().toJSON();
                $('.singlefile_url_field').val(attachment.url);
                $('.vc_param-name-id').val(attachment.id);
            });

            frame.open();
        });
    });
}(jQuery));