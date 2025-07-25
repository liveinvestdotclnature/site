(function ($) {
    $(document).ready(function () {
        $(document).on("click", '.wpmf_avada_select_pdf', function (e) {
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

            // When an image is selected, run a callback.
            frame.on('select', function () {
                // Grab the selected attachment.
                var attachment = frame.state().get('selection').first().toJSON();
                $('.wpmf_avada_pdf_embed input[name="url"]').val(attachment.url).change();
            });

            frame.open();
        });
    });
}(jQuery));