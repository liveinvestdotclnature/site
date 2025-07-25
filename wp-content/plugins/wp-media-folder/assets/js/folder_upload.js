/**
 * Main WP Media Gallery addon script
 */
var wpmfGalleryModule;
(function ($) {
    if (typeof ajaxurl === "undefined") {
        ajaxurl = wpmf.vars.ajaxurl;
    }

    var this_url = new URL(location.href);
    var get_wpmf_folder = this_url.searchParams.get("wpmf-folder");
    var last_selected_folder = wpmfFoldersModule.getCookie('lastAccessFolder_' + wpmf.vars.host);
    //check folder upload same to last selected folder
    if (last_selected_folder && get_wpmf_folder && last_selected_folder !== get_wpmf_folder) {
        window.location.href = wpmf.vars.media_new_url + '?wpmf-folder=' + last_selected_folder;
    };

    wpmfGalleryModule = {
        comment_parent: 0,
        upload_from_pc: false,
        wpmf_current_gallery: 0, // current gallery selected
        target_gallery: 0,
        is_gallery_loading: false,
        is_perpage_change: false,
        current_page_nav: 1, // current page for images gallery selection
        gallery_details: {},
        shouldconfirm: false,
        custom_gird_gutter_change: false,
        is_resizing: true,
        current_tab: 'main-gallery',
        events: [], // event handling
        init: function () {
            var folder_options_html = '';
            var space = '&nbsp;&nbsp;&nbsp;&nbsp;';
            var list_cloud_google = [];
            var list_cloud_dropbox = [];
            var list_cloud_odv = [];
            var list_cloud_odvbs = [];
            var list_cloud_nextcloud = [];
            var list_local = [];
            $('.form_edit_gallery input, .form_edit_gallery select').on('change', function () {
                if ($(this).data('param') === 'gutterwidth') {
                    wpmfGalleryModule.custom_gird_gutter_change = true;
                }
                wpmfGalleryModule.shouldconfirm = true;
                window.onbeforeunload = function() {
                    if (wpmfGalleryModule.shouldconfirm) {
                        return true;
                    }
                };
            });

            $('.form_edit_gallery .edit-gallery-name').on('keyup', function () {
                wpmfGalleryModule.shouldconfirm = true;
                window.onbeforeunload = function() {
                    if (wpmfGalleryModule.shouldconfirm) {
                        return true;
                    }
                };
            });

            wpmfFoldersTreeModule.importCategories();
            $.each(wpmfFoldersTreeModule.categories, function (i, v) {
                if (parseInt(v.id) !== 0) {
                    if (typeof v.drive_type !== 'undefined' && v.drive_type !== '' && v.drive_type === 'google_drive') {
                        list_cloud_google.push({id: v.id, label: v.label, depth: v.depth});
                    } else if(typeof v.drive_type !== 'undefined' && v.drive_type !== '' && v.drive_type === 'dropbox') {
                        list_cloud_dropbox.push({id: v.id, label: v.label, depth: v.depth});
                    } else if(typeof v.drive_type !== 'undefined' && v.drive_type !== '' && v.drive_type === 'onedrive') {
                        list_cloud_odv.push({id: v.id, label: v.label, depth: v.depth});
                    } else if (typeof v.drive_type !== 'undefined' && v.drive_type !== '' && v.drive_type === 'onedrive_business') {
                        list_cloud_odvbs.push({id: v.id, label: v.label, depth: v.depth});
                    } else if (typeof v.drive_type !== 'undefined' && v.drive_type !== '' && v.drive_type === 'nextcloud') {
                        list_cloud_nextcloud.push({id: v.id, label: v.label, depth: v.depth});
                    } else {
                        list_local.push({id: v.id, label: v.label, depth: v.depth});
                    }
                } else {
                    list_local.push({id: 0, label: v.label, depth: 0});
                }
            });

            $.each(list_local, function (i, v) {
                if (typeof v.depth !== "undefined" && parseInt(v.depth) > 0) {
                    folder_options_html += '<option value="' + v.id + '"';
                    if (get_wpmf_folder !== 'undefined' && get_wpmf_folder == v.id){
                        folder_options_html += ' selected ';
                    }
                    folder_options_html += '>' + space.repeat(v.depth) + v.label + '</option>';
                } else {
                    folder_options_html += '<option value="' + v.id + '"'; 
                    if (get_wpmf_folder !== 'undefined' && get_wpmf_folder == v.id){
                        folder_options_html += ' selected ';
                    }
                    folder_options_html += '>' + v.label + '</option>';
                }
            });

            $.each(list_cloud_dropbox, function (i, v) {
                if (typeof v.depth !== "undefined" && parseInt(v.depth) > 0) {
                    folder_options_html += '<option value="' + v.id + '"';
                    if (get_wpmf_folder !== 'undefined' && get_wpmf_folder == v.id){
                        folder_options_html += ' selected ';
                    }
                    folder_options_html += '>' + space.repeat(v.depth) + v.label + '</option>';
                } else {
                    folder_options_html += '<option value="' + v.id + '"'; 
                    if (get_wpmf_folder !== 'undefined' && get_wpmf_folder == v.id){
                        folder_options_html += ' selected ';
                    }
                    folder_options_html += '>' + v.label + '</option>';
                }
            });

            $.each(list_cloud_google, function (i, v) {
                if (typeof v.depth !== "undefined" && parseInt(v.depth) > 0) {
                    folder_options_html += '<option value="' + v.id + '"';
                    if (get_wpmf_folder !== 'undefined' && get_wpmf_folder == v.id){
                        folder_options_html += ' selected ';
                    }
                    folder_options_html += '>' + space.repeat(v.depth) + v.label + '</option>';
                } else {
                    folder_options_html += '<option value="' + v.id + '"'; 
                    if (get_wpmf_folder !== 'undefined' && get_wpmf_folder == v.id){
                        folder_options_html += ' selected ';
                    }
                    folder_options_html += '>' + v.label + '</option>';
                }
            });

            $.each(list_cloud_odv, function (i, v) {
                if (typeof v.depth !== "undefined" && parseInt(v.depth) > 0) {
                    folder_options_html += '<option value="' + v.id + '"';
                    if (get_wpmf_folder !== 'undefined' && get_wpmf_folder == v.id){
                        folder_options_html += ' selected ';
                    }
                    folder_options_html += '>' + space.repeat(v.depth) + v.label + '</option>';
                } else {
                    folder_options_html += '<option value="' + v.id + '"'; 
                    if (get_wpmf_folder !== 'undefined' && get_wpmf_folder == v.id){
                        folder_options_html += ' selected ';
                    }
                    folder_options_html += '>' + v.label + '</option>';
                }
            });

            $.each(list_cloud_odvbs, function (i, v) {
                if (typeof v.depth !== "undefined" && parseInt(v.depth) > 0) {
                    folder_options_html += '<option value="' + v.id + '"';
                    if (get_wpmf_folder !== 'undefined' && get_wpmf_folder == v.id){
                        folder_options_html += ' selected ';
                    }
                    folder_options_html += '>' + space.repeat(v.depth) + v.label + '</option>';
                } else {
                    folder_options_html += '<option value="' + v.id + '"'; 
                    if (get_wpmf_folder !== 'undefined' && get_wpmf_folder == v.id){
                        folder_options_html += ' selected ';
                    }
                    folder_options_html += '>' + v.label + '</option>';
                }
            });

            $.each(list_cloud_nextcloud, function (i, v) {
                if (typeof v.depth !== "undefined" && parseInt(v.depth) > 0) {
                    folder_options_html += '<option value="' + v.id + '"';
                    if (get_wpmf_folder !== 'undefined' && get_wpmf_folder == v.id){
                        folder_options_html += ' selected ';
                    }
                    folder_options_html += '>' + space.repeat(v.depth) + v.label + '</option>';
                } else {
                    folder_options_html += '<option value="' + v.id + '"'; 
                    if (get_wpmf_folder !== 'undefined' && get_wpmf_folder == v.id){
                        folder_options_html += ' selected ';
                    }
                    folder_options_html += '>' + v.label + '</option>';
                }
            });

            $('.wpmf-gallery-folder').html(folder_options_html);

        }
    };

    $(document).on( 'wp-collapse-menu', function () {
        wpmfGalleryModule.initPackery();
    });

    function check_local_to_cloud(id_category, wmpf_nonce, callback){  
        $.ajax({
            method: "POST",
            dataType: "json",
            url: ajaxurl,
            data: {
                action: "wpmf",
                task: 'check_local_to_cloud',
                id_category: id_category,
                wpmf_nonce: wmpf_nonce,
            },
            success: function success(response) {
                callback(response.status);
            },
        });
     }  

    // initialize WPMF gallery features
    $(document).ready(function () {
        wpmfGalleryModule.init();
        var wmpf_nonce = $('.wpmf-gallery-folder').attr('data-wmpf-nonce');
        if (get_wpmf_folder) {
            check_local_to_cloud(get_wpmf_folder, wmpf_nonce, function(is_local_to_cloud){
                uploader.bind('BeforeUpload', function(up, file) {
                    var multipart_params = up.settings.multipart_params;
                    multipart_params['wpmf_nonce'] = wmpf_nonce;
                    multipart_params['wpmf_folder'] = get_wpmf_folder;
                    if (is_local_to_cloud) {
                        multipart_params['id_category'] = get_wpmf_folder;
                        multipart_params['current_category'] = 0;
                    } 
                    up.settings.multipart_params = multipart_params;
                });
            })
        } else {
            uploader.bind('BeforeUpload', function(up, file) {
                var multipart_params = up.settings.multipart_params;
                multipart_params['wpmf_folder'] = 0;
                multipart_params['wpmf_nonce'] = wmpf_nonce;
                if (get_wpmf_folder) {
                    multipart_params['wpmf_folder'] = get_wpmf_folder;
                } 
                up.settings.multipart_params = multipart_params;
            });
        }
        $('.wpmf-gallery-folder').on('change', function(){
            var id_category = $(this).val();
            //check local to cloud
            check_local_to_cloud(id_category, wmpf_nonce, function(is_local_to_cloud){
                uploader.bind('BeforeUpload', function(up, file) {
                    var multipart_params = up.settings.multipart_params;
                    multipart_params['wpmf_nonce'] = wmpf_nonce;
                    if (is_local_to_cloud) {
                        multipart_params['id_category'] = id_category;
                        multipart_params['current_category'] = 0;
                    } else {
                        multipart_params['wpmf_folder'] = id_category;
                    }
                    up.settings.multipart_params = multipart_params;
                });
            })
        });
        
        //change url thumbnail when upload to cloud
        setInterval(function(){
            // Check if element exist
            if ($('#media-items .media-item').length > 0) {
                const ele_pinky = document.querySelectorAll(".pinkynail");
                const title = document.querySelectorAll(".attachment-details .media-list-subtitle");
                const ele_button_copy = document.querySelectorAll(".attachment-details .attachment-tools button");
                const media_item = document.querySelectorAll(".media-item");
                if (ele_pinky && title && ele_button_copy && media_item) {
                    for (let i = 0; i < ele_pinky.length; i++) {
                        var src = ele_pinky[i].currentSrc;
                        var file_name = title[i].innerHTML;
                        var ext =  file_name.split('.').pop();
                        var element_id = media_item[i].id;
                        if (src && file_name && ext && element_id) {
                            var url_thumb = ele_button_copy[i].dataset.clipboardText;
                            //check type of file
                            if(url_thumb) {
                                if (file_name.indexOf('.pdf') > 0 || file_name.indexOf('.doc') > 0) {
                                    url_thumb = wpmf.vars.site_url + '/wp-includes/images/media/document.svg';
                                } else if (file_name.indexOf('.mp3') > 0) {
                                    url_thumb = wpmf.vars.site_url + '/wp-includes/images/media/audio.svg';
                                } else if (file_name.indexOf('.mp4') > 0) {
                                    url_thumb = wpmf.vars.site_url + '/wp-includes/images/media/video.svg';
                                } else if (file_name.indexOf('.avif') > 0 && url_thumb.indexOf('admin-ajax.php?action=wpmf_onedrive_download') < 0 && url_thumb.indexOf('dl.dropboxusercontent.com') < 0 && url_thumb.indexOf('drive.google.com') < 0) {
                                    url_thumb = wpmf.vars.site_url + '/wp-includes/images/media/default.svg';
                                } else if (file_name.indexOf('.xls') > 0 || file_name.indexOf('.csv') > 0) {
                                    url_thumb = wpmf.vars.site_url + '/wp-includes/images/media/spreadsheet.svg';
                                } else if (file_name.indexOf('.pptx') > 0) {
                                    url_thumb = wpmf.vars.site_url + '/wp-includes/images/media/interactive.svg';
                                } else if (file_name.indexOf('.txt') > 0) {
                                    url_thumb = wpmf.vars.site_url + '/wp-includes/images/media/text.svg';
                                }
                                var element_image = '#' + element_id + ' img';
                                $(element_image).attr('src', url_thumb); 
                            }
                        }
                    }
                }
            }
        }, 1500);
    });

})(jQuery);
