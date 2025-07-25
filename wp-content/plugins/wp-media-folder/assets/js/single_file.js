jQuery(document).ready(function ($) {
    $('.wpmf-defile').on('click', function (e) {
        e.preventDefault();
        var id = $(this).data('id');
        var href = $(this).attr('href');
        if (href.indexOf('docs.google.com') != -1) {
            window.open(href);
        } else {
            window.location.href = wpmf_single.vars.site_url + '?act=wpmf_download_file&id=' + id + '&wpmf_nonce=' + wpmf_single.vars.wpmf_nonce;
        }
    });

    //remove black background iframe
    $('.wpmf-block-embed__wrapper').find('iframe').each(function(){
        var src = $(this).attr('src');
        var check_video_kaltura = src.indexOf("kaltura")
        if (check_video_kaltura > 0) {
            $(this).parent().addClass('wrapper-kaltura'); 
            $(this).parent().parent().addClass('wrapper-kaltura-center'); 
        }
    });

    //set lowercase for tag
    $('#new-tag-wpmf_tag').on('keyup', function(){
        var tag = $(this).val().toLowerCase();
        $(this).val(tag);
    })
});