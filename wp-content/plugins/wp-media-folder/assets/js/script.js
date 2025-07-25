'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Main WP Media Folder script
 * It handles the categories filtering
 */
var wpmfFoldersModule = void 0,
    wpmfAddCloudQueue = void 0,
    cloud_sync_loader_icon = void 0;
(function ($) {
    wpmfFoldersModule = {
        taxonomy: null, // WPMF taxonomy
        categories_order: null, // Categories ids in order
        categories: null, // All categories objects
        media_root: null, // Id of media folder root category
        relation_category_filter: [], // Relation between categories variable and filter select
        relation_filter_category: [], // Relation between filter select content and category categories variable
        last_selected_folder: 0, // Last folder we moved into
        attachments_browser_initialized: false, // Is the attachment browser already initialized
        attachments_browser: null, // Variable used to store attachment browser reference to use it later
        dragging_elements: null, // Variable used to store elements while dragging files or folders
        hover_image: false, // Do we show or not the image on hover
        aws3_label: false, // Do we show or not the attachment label
        hover_images: [], // hover images
        doing_global_search: false, // Save status of search
        folder_ordering: 'name-ASC', // Folder ordering
        page_type: null, // Current page type upload-list, upload-grid
        editFolderId: 0, // Current folder id to edit or delete ...
        editFileId: 0, // Current file id to edit
        folder_search: null,
        events: [], // event handling
        upload_folder: null,
        reload_attachment: true,
        added_files_length: 0,
        uploaded_files_length: 0,
        limit_folders: 400,
        enable_folders: true,
        wpmfTotalSize: 0,
        filesTotal: 0,
        /**
         * Retrieve the current displayed frame
         */
        getFrame: function getFrame() {
            if (wpmfFoldersModule.page_type === 'upload-list') {
                // We're in the list mode
                return $('.upload-php #posts-filter');
            } else {
                if ($('.media-frame.mode-select[id^="__wp-uploader-id-"]:visible').length) {
                    return $('.media-frame.mode-select[id^="__wp-uploader-id-"]:visible');
                } else {
                    return $('[id^="__wp-uploader-id-"]:visible div.media-frame');
                }
            }
        },

        /**
         * Initialize module related things
         */
        initModule: function initModule() {
            if (!$('.ju-status-wrap').length) {
                $(document).on('move_queue_status', function (e, files_length) {
                    if (typeof files_length !== "undefined") {
                        var text = wpmf.l18n.mv_local_cloud_msg.replace('%d', files_length);
                        wpmfSnackbarModule.show({
                            id: 'move_local_to_cloud',
                            content: text,
                            auto_close: false,
                            is_progress: true,
                            icon: '<span class="material-icons-outlined wpmf-snack-icon wpmf-snack-loader">sync</span>'
                        });

                        // call ju queue on builder
                        if (!$('.ju_queue_status').length) {
                            var queue_process = setInterval(function () {
                                $.ajax({
                                    url: wpmf.vars.ajaxurl,
                                    type: 'POST',
                                    data: {
                                        action: 'ju_queue'
                                    },
                                    success: function success(data) {
                                        $(document).trigger('ju_queue_updated_status', data);
                                        if (parseInt(data.queue_length) === 0) {
                                            clearInterval(queue_process);
                                        }
                                    },
                                    error: function error() {
                                        clearInterval(queue_process);
                                    }
                                });
                            }, 15000);
                        }
                    }
                });

                $(document).on('ju_queue_updated_status', function (e, data) {
                    var text;
                    var htmlString = data.status_html;
                    if (!$('.ju_queue_status_res').length) {
                        var div = document.createElement('div');
                        div.innerHTML = htmlString.trim();
                        div.classList.add('ju_queue_status_res_wrap');
                        div.style.display = 'none';
                        document.body.appendChild(div);
                    }

                    setTimeout(function () {
                        var move_length = $('.ju_queue_status_res li[data-id="wpmf_move_local_to_cloud"]').length;
                        var delete_length = $('.ju_queue_status_res li[data-id="wpmf_remove_local_file"]').length;
                        if (typeof move_length === "undefined") {
                            move_length = 0;
                        }

                        if (typeof delete_length === "undefined") {
                            delete_length = 0;
                        }

                        if (parseInt(move_length) !== 0 || parseInt(delete_length) !== 0) {
                            if (move_length > delete_length) {
                                text = $('.ju_queue_status_res li[data-id="wpmf_move_local_to_cloud"]').html();
                            } else {
                                text = $('.ju_queue_status_res li[data-id="wpmf_remove_local_file"]').html();
                            }

                            wpmfSnackbarModule.show({
                                id: 'move_local_to_cloud',
                                content: text,
                                auto_close: false,
                                is_progress: true,
                                icon: '<span class="material-icons-outlined wpmf-snack-icon wpmf-snack-loader">sync</span>'
                            });
                        } else {
                            wpmfSnackbarModule.close('move_local_to_cloud');
                        }

                        if ($('.ju_queue_status_res_wrap').length) {
                            $('.ju_queue_status_res_wrap').remove();
                        }
                    }, 200);
                });
            }

            // Retrieve values we'll use
            wpmfFoldersModule.limit_folders = parseInt(wpmf.vars.limit_folders_number);
            wpmfFoldersModule.taxonomy = wpmf.vars.taxo;
            wpmfFoldersModule.categories_order_full = wpmf.vars.wpmf_categories_order;
            wpmfFoldersModule.categories = wpmf.vars.wpmf_categories;
            wpmfFoldersModule.categories_order = wpmfFoldersModule.categories_order_full.length > wpmfFoldersModule.limit_folders ? wpmfFoldersModule.categories_order_full.slice(0, wpmfFoldersModule.limit_folders) : wpmfFoldersModule.categories_order_full;
            wpmfFoldersModule.media_root = wpmf.vars.root_media_root;
            wpmfFoldersModule.show_files_count = parseInt(wpmf.vars.option_countfiles) === 1;
            wpmfFoldersModule.enable_folders = wpmfFoldersModule.categories_order_full.length > wpmfFoldersModule.limit_folders ? 0 : wpmf.vars.enable_folders;

            // Define the page type
            if (wpmf.vars.wpmf_pagenow === 'upload.php' && $('#posts-filter input[name="mode"][value="list"]').length && $('#posts-filter .media').length) {
                wpmfFoldersModule.page_type = 'upload-list';

                wpmfFoldersModule.folder_ordering = wpmf.vars.wpmf_order_f;
            } else if (wpmf.vars.wpmf_pagenow === 'upload.php' && $('#wp-media-grid').length) {
                wpmfFoldersModule.page_type = 'upload-grid';
            }

            if (wpmf.vars.option_hoverimg === 1) wpmfFoldersModule.hover_image = true;
            if (wpmf.vars.aws3_label === 1) wpmfFoldersModule.aws3_label = true;

            var init = function init() {
                var $current_frame = wpmfFoldersModule.getFrame();

                // Add remote button
                if (wpmf.vars.hide_remote_video) {
                    if (wpmf.vars.wpmf_pagenow === 'upload.php') {
                        if (!$('.wpmf_btn_remote_video').length) {
                            $('.page-title-action').after('<a class="wpmf_icon_remote_video">' + wpmf.l18n.remote_video + '</a>');
                            wpmfFoldersModule.initRemoteVideo();
                        }
                    }
                }

                if (!$('.wpmf_btn_upload_folder').length) {
                    $('.page-title-action').after('<a href="#" class="wpmf_btn_upload_folder">' + wpmf.l18n.upload_folder_label + '</a><input name="id_category" class="wpmf_id_category" type="hidden" value="0">');
                }

                // Download file table list media
                $('.wp-list-table .download').off('click').on('click', function (e){
                    e.preventDefault();
                    var post_id = $(this).parent().parent().parent().attr('id');
                    if (post_id) {
                        var post_id_array = post_id.split("-");
                        if (Array.isArray(post_id_array)) {
                            let id = post_id_array.pop();
                            if (id) {
                                $.ajax({
                                    type: "POST",
                                    url: wpmf.vars.ajaxurl,
                                    data: {
                                        action: "wpmf",
                                        task: "wpmf_download_file",
                                        id: id,
                                        wpmf_nonce: wpmf.vars.wpmf_nonce
                                    },
                                    success: function success(response) {
                                        if (response.status) {
                                            window.location.href = wpmf.vars.site_url + '?act=wpmf_download_file&id=' + id + '&wpmf_nonce=' + wpmf.vars.wpmf_nonce;
                                        } else {
                                            showDialog({
                                                text: wpmf.l18n.cannot_download,
                                                closeicon: true
                                            });
                                        }
                                    }
                                });
                            }
                        } 
                    }
                })
                
                $('#doaction').on('click', function (e) {
                    var action = $('#bulk-action-selector-top').val();
                    //get list post id
                    var cboxes = document.getElementsByName('media[]');
                    var post_ids = [];
                    var len = cboxes.length;
                    if (cboxes !== 'undefined') {
                        for (var i=0; i<len; i++) {
                            if(cboxes[i].checked) {
                                post_ids.push(cboxes[i].value);
                            }
                        }
                    }
                    //Select tag for media
                    if (wpmf.vars.wpmf_pagenow === 'upload.php' && action == 'tag') {
                        e.preventDefault();
                        if (post_ids.length > 0) {
                            var html = "<p class='tag-note'>To select a tag, first choose one from the existing list. If the tag you need isn't there, you can create a new one.</p>";
                            html += '<input name="tags-outside" class="tagify--outside" value="" placeholder="Write tags to add below">';
                            //show tagify for tags
                            showDialog({
                                id: 'wpmf-add-tag-dialog',
                                title: wpmf.l18n.create_or_select_tag,
                                text: html,
                                negative: {
                                    title: wpmf.l18n.cancel
                                },
                                positive: {
                                    title: wpmf.l18n.add,
                                    onClick: function onClick(e) {
                                        var value = $('input[name=tags-outside]').val();
                                        if (value) {
                                            var array_value = JSON.parse(value);
                                            var tag_name = [];
                                            array_value.forEach(element => {
                                                tag_name.push(element.value);
                                            });
                                            //save tag
                                            if (tag_name.length) {
                                                $.ajax({
                                                    method: "POST",
                                                    dataType: "json",
                                                    url: wpmf.vars.ajaxurl,
                                                    data: {
                                                        action: "wpmf",
                                                        task: "save_tag_item",
                                                        tag_name: tag_name,
                                                        post_ids: post_ids,
                                                        wpmf_nonce: wpmf.vars.wpmf_nonce
                                                    },
                                                    success: function success(response) {
                                                        if (response.status) {
                                                            window.location.reload();
                                                        } else {
                                                            console.log(response.status);
                                                        }             
                                                    }
                                                });
                                            } 
                                        }
                                    }
                                }
                            });
                            //set tagify
                            var input = document.querySelector('input[name=tags-outside]')
                            var tagify = new Tagify(input, {
                                focusable: false,
                                dropdown: {
                                    position: 'input',
                                    enabled: 0 // always opens dropdown when input gets focus
                                }
                            });
                            //get 10 tag items
                            $.ajax({
                                method: "POST",
                                dataType: "json",
                                url: wpmf.vars.ajaxurl,
                                data: {
                                    action: "wpmf",
                                    task: "get_tag_item",
                                    wpmf_nonce: wpmf.vars.wpmf_nonce
                                },
                                success: function success(response) {
                                    if (response.status) {
                                        tagify.whitelist = response.list_tags; // update whitelist
                                    }
                                }
                            });
                            //search tag
                            document.querySelector('.tagify__input').addEventListener("keyup", function (e) {
                                var tag_name = $(this).html();
                                if (tag_name.length > 1) {
                                    $.ajax({
                                        method: "POST",
                                        dataType: "json",
                                        url: wpmf.vars.ajaxurl,
                                        data: {
                                            action: "wpmf",
                                            task: "get_tag_item",
                                            tag_name : tag_name,
                                            wpmf_nonce: wpmf.vars.wpmf_nonce
                                        },
                                        success: function success(response) {
                                            if (response.status) {
                                                tagify.whitelist = response.list_tags // update whitelist
                                            }
                                        }
                                    });
                                }
                            });
                        } else {
                            showDialog({
                                text: wpmf.l18n.select_file_required,
                                closeicon: true
                            });
                        }
                    }
                });

                //fix delete file submit on list view
                $('.wp-list-table .row-actions .delete .submitdelete').attr('onclick', 'return');
                $('.wp-list-table .row-actions .delete .submitdelete').off('click').on('click', function (e) { 
                    e.preventDefault();
                    var confirm = showNotice.warn();
                    if (confirm) {
                        var href = $(this).attr('href');
                        var id = href.substring(
                            href.indexOf("post=") + 5, 
                            href.lastIndexOf("&")
                        );
                        if (id && !isNaN(id)){
                            $.ajax({
                                type: "POST",
                                url: wpmf.vars.ajaxurl,
                                data: {
                                    action: "wpmf",
                                    task: "delete_file",
                                    id: id,
                                    wpmf_nonce: wpmf.vars.wpmf_nonce
                                },
                                success: function success(response) {
                                    if (response.status) {
                                        window.location.reload();
                                    }
                                }
                            });
                        } 
                    }
                });

                // add iframe to play mp4 in attachment detail on google drive
                $('#wp-media-grid .media-frame').off('click').on('click', function (e) { 
                    var file_name = $(".attachment-info .details .filename").html();
                    if (file_name && file_name.indexOf('.mp4') > 0) {
                        var src = $('.thumbnail-video img').attr('src');
                        if (src && src.indexOf('drive.google.com') > 0) {
                            //get id video
                            var id = src.substring(
                                src.indexOf("id=") + 3, 
                                src.lastIndexOf("&")
                            );
                            $('.wp-video').remove();
                            $('.thumbnail-video .details-image').remove();
                            $('.thumbnail-video').attr('style', 'width: 480px; height: 270px');
                            if (id) {
                                var html = "<iframe src='https://drive.google.com/file/d/" + id + "/preview' width='100%' height='100%'  allow='autoplay'";
                                html += "></iframe>";
                                $('.thumbnail-video').append(html);
                            }
                        }
                    } else if (file_name && file_name.indexOf('.mp3') > 0) {
                        var src = $('.thumbnail-audio .wp-audio-shortcode mediaelementwrapper audio').attr('src');
                        if (src && src.indexOf('drive.google.com') > 0) {
                            //get id video
                            var id = src.substring(
                                src.indexOf("id=") + 3, 
                                src.lastIndexOf("&e")
                            );
                            //get width and height video
                            $('.wp-audio').remove();
                            if (id) {
                                var html = "<iframe src='https://drive.google.com/file/d/" + id + "/preview' allow='autoplay'";
                                html += "></iframe>";
                                $('.thumbnail-audio').append(html);
                            }
                        }
                    }
                    //fix style for google item
                    if (file_name && file_name.indexOf('.mp3') > 0 || file_name && file_name.indexOf('.csv') > 0 || file_name && file_name.indexOf('.zip') > 0) {
                        $('.thumbnail .details-image').attr('style', 'background-image:none');
                    }
                })

                // add bulk upload to s3 button
                if (parseInt(wpmf.vars.copy_files_to_bucket) === 1) {
                    if (!$current_frame.find('.bulk-upload-s3-btn').length) {
                        $current_frame.find('.media-frame-content .media-toolbar-secondary .delete-selected-button').after('<button class="button bulk-upload-s3-btn media-button button-large">' + wpmf.l18n.bulk_copy_files_to_s3 + '</button>');
                        $('.bulk-upload-s3-btn').on('click', function () {
                            var local_files = [];
                            $('li.attachment.selected').each(function (i, v) {
                                local_files.push($(v).data('id'));
                            });
                            local_files = local_files.join();
                            wpmfFoldersModule.uploadFilesToS3(local_files);
                        });
                    }
                }
                // end add bulk upload to s3 button

                // get last access folder
                var lastAccessFolder = wpmfFoldersModule.getCookie('lastAccessFolder_' + wpmf.vars.host);
                if (wpmfFoldersModule.page_type !== 'upload-list') {
                    // Do not add WPMF when editing a gallery
                    if (wp.media.frame !== undefined && wp.media.frame._state === 'gallery-edit') {
                        wpmfFoldersModule.trigger('wpGalleryEdition');
                        $('ul.attachments .wpmf-attachment:not(.wpmf-new):not(.wpmf-back):not(.ui-droppable)').draggable('disable');
                        return;
                    }
                }

                // Initialize select folder filter
                wpmfFoldersModule.initLoadingFolder();
                // Select the first item of folder filter
                if (wpmfFoldersModule.page_type !== 'upload-list') {
                    if (typeof lastAccessFolder === "undefined" || typeof lastAccessFolder !== "undefined" && lastAccessFolder === '' || typeof lastAccessFolder !== "undefined" && parseInt(lastAccessFolder) === 0 || typeof wpmfFoldersModule.categories[lastAccessFolder] === "undefined") {
                        if (typeof wpmfFoldersModule.relation_category_filter[wpmfFoldersModule.last_selected_folder] === "undefined") {
                            wpmfFoldersModule.changeFolder(wpmfFoldersModule.getCurrentFolderId());
                        } else {
                            $current_frame.find('#wpmf-media-category').val(wpmfFoldersModule.relation_category_filter[wpmfFoldersModule.last_selected_folder]).trigger('change');
                        }
                    } else {
                        $current_frame.find('#wpmf-media-category').val(wpmfFoldersModule.relation_category_filter[lastAccessFolder]).trigger('change');
                    }
                }

                // render context menu box
                wpmfFoldersModule.renderContextMenu();

                // render folder permissions wrap
                wpmfFoldersModule.renderFolderPermissionsWrap();

                // Add the breadcrumb
                if ($current_frame.find('#wpmf-breadcrumb').length === 0) {
                    if (wpmfFoldersModule.page_type !== 'upload-list') {
                        $current_frame.find('.attachments-browser ul.attachments').before('<ul id="wpmf-breadcrumb"></ul>');
                    } else {
                        $current_frame.find('.tablenav.top').before('<ul id="wpmf-breadcrumb"></ul>');
                    }
                }

                // Initialize some thing for listing page
                if (wpmfFoldersModule.page_type === 'upload-list') {
                    // Create folder container for list view
                    $current_frame.find('.tablenav.top').before('<ul class="attachments"></ul>');
                    if (typeof lastAccessFolder === "undefined" || typeof lastAccessFolder !== "undefined" && lastAccessFolder === '' || typeof lastAccessFolder !== "undefined" && parseInt(lastAccessFolder) === 0) {
                        wpmfFoldersModule.last_selected_folder = 0;
                    } else {
                        wpmfFoldersModule.last_selected_folder = lastAccessFolder;
                        $('#wpmf-media-category').val(wpmfFoldersModule.last_selected_folder);
                    }

                    // Change the upload href link to add current folder as parameter
                    $('.page-title-action').attr('href', $('.page-title-action').attr('href') + '?wpmf-folder=' + wpmfFoldersModule.last_selected_folder);
                }

                if (typeof wpmf.vars.hide_tree === "undefined" || parseInt(wpmf.vars.hide_tree) === 0) {
                    // Remove the loader on list page
                    if (wpmfFoldersModule.page_type === 'upload-list' && !$('.upload-php #posts-filter').hasClass('listview-loaded')) {
                        setTimeout(function () {
                            $('.upload-php #posts-filter').addClass('listview-loaded');
                        }, 200);
                    }
                    $('.wp-filter').addClass('wpmf-no-tree');
                }

                // Change the upload href link to add current folder as parameter
                var new_media_url = $('#menu-media').find('a[href="media-new.php"]').attr('href');
                $('#menu-media li a[href="media-new.php"]').attr('href', new_media_url + '?wpmf-folder=' + wpmfFoldersModule.last_selected_folder);

                // Initialize breadcrumb
                wpmfFoldersModule.updateBreadcrumb();

                // check if enable display own media
                if (typeof lastAccessFolder === "undefined" || typeof lastAccessFolder !== "undefined" && lastAccessFolder === '' || typeof lastAccessFolder !== "undefined" && parseInt(lastAccessFolder) === 0) {
                    // Finally render folders
                    wpmfFoldersModule.renderFolders();
                } else {
                    // Finally render folders
                    if (typeof wpmfFoldersModule.categories[parseInt(lastAccessFolder)] !== "undefined") {
                        wpmfFoldersModule.renderFolders(parseInt(lastAccessFolder));
                    } else {
                        wpmfFoldersModule.renderFolders();
                    }
                }

                if (wpmfFoldersModule.page_type !== 'upload-list') {
                    // Attach event when something is added to the attachments list
                    var timeout = void 0;
                    // call drag folderempty attachment
                    wpmfFoldersModule.initializeDragAndDropAttachments();
                    wpmfFoldersModule.openContextMenuFolder();
                    // Select the node that will be observed for mutations
                    // call open context menu when empty attachment
                    const targetNode =  $current_frame.find('.attachments-browser ul.attachments')[0];
                    // Options for the observer (which mutations to observe)
                    const config = { attributes: true, childList: true, subtree: true };

                    // Callback function to execute when mutations are observed
                    const callback = (mutationList, observer) => {
                    for (const mutation of mutationList) {
                        if (mutation.type === "childList") {
                            // Wait All DOMInserted events to be thrown before calling the initialization functions
                            window.clearTimeout(timeout);
                            timeout = window.setTimeout(function () {
                                // Hovering image intialization
                                wpmfFoldersModule.initHoverImage();
                                wpmfFoldersModule.initAttachmentLabelS3();

                                // open / close context menu box
                                wpmfFoldersModule.openContextMenuFile();
                                wpmfFoldersModule.openContextMenuFolder();
                                wpmfFoldersModule.getFrame().find('.attachments-browser ul.attachments .attachment .thumbnail').each(function (e) {
                                    var $this = $(this);
                                    if ($this.closest('.attachment-preview').hasClass('type-image') && !$this.closest('.attachment.loading').length) {
                                        var _id = $this.closest('.attachment').data('id');
                                        var cloud_media = wp.media.attachment(_id).get('cloud_media');
                                        var url = wp.media.attachment(_id).get('url');

                                        if (typeof url !== "undefined") {
                                            if (url.indexOf('action=wpmf') !== -1 || url.indexOf('api.onedrive.com') !== -1 || url.indexOf('drive.google.com') !== -1 || url.indexOf('dropbox.com') !== -1) {
                                                $this.css('background', 'transparent url(' + wpmf.vars.img_url + 'spinner.gif) center no-repeat');
                                                $this.find('img').on('load', function () {
                                                    $this.css('background', 'transparent');
                                                });
                                            }
                                        }

                                        if (parseInt(cloud_media) === 1) {
                                            $this.closest('li').addClass('wpmf_cloud_media').removeClass('wpmf_local_media');
                                        } else {
                                            $this.closest('li').removeClass('wpmf_cloud_media').addClass('wpmf_local_media');
                                        }
                                    }
                                });

                                // Attach drag and drop event to the attachments
                                wpmfFoldersModule.initializeDragAndDropAttachments();
                            }, 300);
                        }
                    }
                    };

                    if (targetNode){
                        // Create an observer instance linked to the callback function
                        const observer = new MutationObserver(callback);
                            
                        // Start observing the target node for configured mutations
                        observer.observe(targetNode, config);

                        // Later, you can stop observing
                        // observer.disconnect();
                    }

                    // Add the creation gallery from folder button

                    if (typeof wp.data === "undefined" || typeof wp.data !== "undefined" && typeof wp.data.select('core/editor') === "undefined") {
                        wpmfFoldersModule.addCreateGalleryBtn();
                    }
                } else {
                    // Attach drag and drop event to the attachments
                    wpmfFoldersModule.initializeDragAndDropAttachments();

                    // open / close context menu box
                    wpmfFoldersModule.openContextMenuFolder();
                }

                wpmfFoldersModule.trigger('ready', $current_frame);
            };

            if ($('.upload-php #posts-filter input[name="mode"][value="list"]').length) {
                // Initialize directly in list mode
                init();
            } else {
                // Initialize folders rendering when the attachment browser is ready
                if (typeof wp !== "undefined") {
                    if (typeof wp.media !== "undefined" && typeof wp.media.view !== "undefined" && typeof wp.media.view.AttachmentsBrowser !== "undefined") {
                        wp.media.view.AttachmentsBrowser.prototype.on('ready', function () {
                            init();
                        });
                    }
                }
            }

            if (wpmfFoldersModule.page_type !== 'upload-list') {
                // Extend uploader to send some POST datas with the uploaded file
                if (typeof wp === "undefined") {
                    return;
                }

                if (typeof wp.Uploader === "undefined") {
                    return;
                }
                var upload_type = 'file';
                $.extend(wp.Uploader.prototype, {
                    init: function init() {
                        var this_url = document.URL;
                        if (this_url.indexOf('media-new.php') < 0) {
                            // Add the current wpmf folder to the request
                            this.uploader.bind('BeforeUpload', function(up, e) {
                                e.wpmf_folder = typeof e.wpmf_folder !== "undefined" ? e.wpmf_folder : wpmfFoldersModule.last_selected_folder;
                                var file = e.getSource();
                                delete this.settings.multipart_params['relativePath'];
                                if (file.relativePath !== '') {
                                    this.settings.multipart_params['relativePath'] = file.relativePath;
                                    upload_type = 'folder';
                                }
                                var multipart_params = up.settings.multipart_params;
                                multipart_params['wpmf_nonce'] = wpmf.vars.wpmf_nonce;
                                multipart_params['wpmf_folder'] = e.wpmf_folder;
                                up.settings.multipart_params = multipart_params;
                            });
                        }

                        this.uploader.bind('FilesAdded', function (up, files) {
                            wpmfFoldersModule.added_files_length = parseInt(wpmfFoldersModule.added_files_length) + files.length;
                            files.forEach(function (t) {
                                t.wpmf_folder = wpmfFoldersModule.last_selected_folder;
                            });
                        });

                        this.uploader.bind('FileUploaded', function (up, file, response) {
                            wpmfFoldersModule.uploaded_files_length++;
                        });

                        // Reload attachments so they can show up if we're inside a folder
                        this.uploader.bind('UploadComplete', function (e, t) {
                            wpmfSnackbarModule.show({
                                id: 'upload_completed',
                                content: wpmf.l18n.media_uploaded,
                                auto_close_delay: 3000
                            });
                            wpmfFoldersModule.added_files_length = 0;
                            wpmfFoldersModule.uploaded_files_length = 0;
                            wpmfFoldersModule.upload_folder = null;
                            wpmfFoldersModule.reloadAttachments();

                            if (upload_type === 'folder') {
                                upload_type = 'file';
                                $.ajax({
                                    type: "POST",
                                    url: wpmf.vars.ajaxurl,
                                    data: {
                                        action: "wpmf",
                                        task: "reload_folder_tree",
                                        wpmf_nonce: wpmf.vars.wpmf_nonce
                                    },
                                    success: function success(response) {
                                        if (response.status) {
                                            wpmfFoldersModule.categories = response.categories;
                                            wpmfFoldersModule.categories_order = response.categories_order;

                                            // Regenerate the folder filter
                                            wpmfFoldersModule.initFolderFilter();

                                            // Reload the folders
                                            wpmfFoldersModule.renderFolders();
                                            wpmfFoldersModule.trigger('addFolder', '');
                                        }
                                    }
                                });
                            } else {
                                wpmfFoldersModule.renderFolders();
                            }

                            // Hovering image intialization
                            wpmfFoldersModule.initHoverImage();
                            wpmfFoldersModule.initAttachmentLabelS3();
                            if (wpmfFoldersModule.show_files_count) {
                                wpmfFoldersModule.updateCountFiles(wpmfFoldersModule.last_selected_folder);
                            }
                        });

                        if (wpmfFoldersModule.show_files_count) {
                            jQuery(document).ajaxComplete(function (e, xhs, req) {
                                try {
                                    if (req.data.indexOf("action=delete-post") > -1) {
                                        if (xhs.responseText == -3) {
                                            alert(wpmf.l18n.remove_file_permission_msg);
                                        } else {
                                            wpmfFoldersModule.trigger('deleteFile', wpmfFoldersModule.last_selected_folder);
                                        }
                                    }

                                    if (req.data.indexOf("action=wpmf&task=delete_file") > -1) {
                                        if (xhs.responseText == -3) {
                                            alert(wpmf.l18n.remove_file_permission_msg1);
                                        }
                                    }

                                    if (req.data.indexOf("action=save-attachment") > -1) {
                                        if (xhs.responseText == -3) {
                                            alert(wpmf.l18n.update_file_permission_msg);
                                        }
                                    }
                                } catch (e) {}
                            }.bind(this));
                        }
                    }
                });

                // Initialize folders rendering on media modal events
                var myMediaViewModal = wp.media.view.Modal;
                if (typeof myMediaViewModal !== "undefined") {
                    wp.media.view.Modal = wp.media.view.Modal.extend({
                        open: function open() {
                            myMediaViewModal.prototype.open.apply(this, arguments);
                            if (wpmf.vars.wpmf_pagenow !== 'upload.php') {
                                if (typeof ElementorConfig !== "undefined" || typeof DIVI !== "undefined" || wpmf.vars.wpmf_pagenow === 'customize.php') {
                                    wpmfFoldersModule.reloadAttachments();
                                }
                            }
                            if (typeof wp.media.frame !== "undefined") {
                                wp.media.frame.on('router:render:browse', function () {
                                    init();
                                });
                                wp.media.frame.on('content:activate:browse', function () {
                                    init();
                                });
                            } else {
                                wpmfFoldersModule.renderFolders();
                            }
                        }
                    });
                }

                // Hide create gallery button if attachments are selected
                if (typeof wpmf.vars.usegellery !== "undefined" && parseInt(wpmf.vars.usegellery) === 1) {
                    var _myMediaViewToolbar = wp.media.view.Toolbar;
                    if (typeof _myMediaViewToolbar !== "undefined") {
                        wp.media.view.Toolbar = wp.media.view.Toolbar.extend({
                            refresh: function refresh() {
                                _myMediaViewToolbar.prototype.refresh.apply(this, arguments);
                                var state = this.controller.state(),
                                    selection = state.get('selection');
                                if (typeof state !== "undefined" && typeof selection !== "undefined") {
                                    if (selection.length === 0) {
                                        $('.btn-selectall,.btn-selectall-gallery').show();
                                        $('.media-button-gallery').hide();
                                    } else {
                                        $('.btn-selectall,.btn-selectall-gallery').hide();
                                        $('.media-button-gallery').show();
                                    }
                                }
                            }
                        });
                    }
                }

                var myMediaControllerCollectionEdit = wp.media.controller.CollectionEdit;
                if (typeof myMediaControllerCollectionEdit !== "undefined") {
                    wp.media.controller.CollectionEdit = wp.media.controller.CollectionEdit.extend({
                        activate: function activate() {
                            myMediaControllerCollectionEdit.prototype.activate.apply(this, arguments);
                        },
                        deactivate: function deactivate() {
                            myMediaControllerCollectionEdit.prototype.deactivate.apply(this, arguments);
                        }
                    });
                }

                // display folder on feature image
                var myMediaControllerFeaturedImage = wp.media.controller.FeaturedImage;
                if (typeof myMediaControllerFeaturedImage !== "undefined") {
                    wp.media.controller.FeaturedImage = wp.media.controller.FeaturedImage.extend({
                        updateSelection: function updateSelection() {
                            myMediaControllerFeaturedImage.prototype.updateSelection.apply(this, arguments);
                            wpmfFoldersModule.renderFolders();
                        }
                    });
                }

                // Create and initialize select filter used to filter by folder
                wpmfFoldersModule.initFolderFilter();

                // Add button to the uploader content page
                var myMediaViewToolbar = wp.media.view.UploaderInline;
                if (typeof myMediaViewToolbar !== "undefined") {
                    wp.media.view.UploaderInline = wp.media.view.UploaderInline.extend({
                        ready: function ready() {
                            myMediaViewToolbar.prototype.ready.apply(this, arguments);
                            // Add remote video button
                            if (wpmf.vars.hide_remote_video) {
                                if (!this.$el.find('.wpmf_btn_remote_video').length) {
                                    this.$el.find('.upload-ui button').after('<button href="#" class="wpmf_btn_remote_video button button-hero">' + wpmf.l18n.remote_video + '</button>');
                                    wpmfFoldersModule.initRemoteVideo();
                                }
                            }

                            // render folder tree in left menu
                            if (typeof wpmf.vars.hide_tree !== "undefined" && parseInt(wpmf.vars.hide_tree) === 1) {
                                wpmfFoldersTreeModule.initModule(wpmfFoldersModule.getFrame());
                            }

                            if (wpmf.vars.wpmf_pagenow !== 'upload.php') {
                                if (!this.$el.find('.wpmf_msg_upload_folder').length) {
                                    var bread = '';
                                    var lastAccessFolder = wpmfFoldersModule.getCookie('lastAccessFolder_' + wpmf.vars.host);
                                    if (typeof lastAccessFolder === "undefined" || typeof lastAccessFolder !== "undefined" && lastAccessFolder === '' || typeof lastAccessFolder !== "undefined" && parseInt(lastAccessFolder) === 0 || typeof wpmfFoldersModule.categories[lastAccessFolder] === "undefined") {
                                        bread = wpmfFoldersModule.getBreadcrumb();
                                    } else {
                                        bread = wpmfFoldersModule.getBreadcrumb(lastAccessFolder);
                                    }
                                    this.$el.find('.post-upload-ui').after('<p class="wpmf_msg_upload_folder">' + wpmf.l18n.msg_upload_folder + '<span>' + bread + '</span></p>');
                                }
                            }
                        }
                    });
                }

                // Manage reset iframe
                wp.Uploader.queue.on('reset', function () {
                    // remove attachment loading
                    wpmfFoldersModule.wpmfTotalSize = 0;
                    $('.attachment.loading').remove();
                    if (!$('.wpmf-process-file-item.wpmf-uploading').length) {
                        $('.wpmf-process-lists').remove();
                        wpmfFoldersModule.wpmfTotalSize = 0;
                        wpmfFoldersModule.filesTotal = 0;
                    }
                });

                // Manage adding an uploaded file
                wp.Uploader.queue.on('add', function (file_info) {
                    if (parseInt(wpmf.vars.wpmf_post_type) !== 1 || !$('#wpb_visual_composer').is(":visible")) {
                        if (typeof wp.media.frame !== 'undefined' && typeof wp.media.frame._state !== 'undefined' && wp.media.frame._state !== 'featured-image') {
                            // Create the download attachment
                            wpmfFoldersModule.getFrame().find('.attachments-browser .attachments').prepend('<li data-cid="' + file_info.attributes.file.id + '" class="attachment loading"><div class="attachment-preview js--select-attachment type-image subtype-jpeg portrait"><div class="thumbnail"><div class="media-progress-bar"><div style="width:0"></div></div></div></div></li>');
                        }
                    }
                    if (!$('.wpmf-process-lists').length) {
                        $('body').append('\n                        <div class="wpmf-process-lists">\n    <div class="wpmf-process-head">\n    <span class="wpmf-process-head-bar"></span>\n        <span class="wpmf-upload-head-text"><span>' + wpmf.l18n.uploaded + ' <span class="wpmf-upload-completed">0</span> / <span class="wpmf-upload-total">0</span><br><span class="wpmf-upload-head-time">' + wpmf.l18n.upload_text + '</span></span>\n        </span>\n        <div class="wpmf-head-upload-actions"><span class="material-icons-outlined wpmf-head-upload-action-expand"> expand_more </span><span class="material-icons-outlined wpmf-head-upload-action-close"> close </span></div>\n    </div>\n    <div class="wpmf-process-body">\n        <ul></ul>\n    </div>\n    <div class="wpmf-process-foot"><span>' + wpmf.l18n.total_size + '&nbsp;</span><span class="wpmf-upload-total-size">0</span></div>\n</div>\n                        ');

                        $('.wpmf-head-upload-action-close').unbind('click').bind('click', function () {
                            $('.wpmf-process-lists').remove();
                            wpmfFoldersModule.wpmfTotalSize = 0;
                            wpmfFoldersModule.filesTotal = 0;
                        });

                        $('.wpmf-head-upload-action-expand').unbind('click').bind('click', function () {
                            $('.wpmf-process-body').toggleClass('hide');
                        });
                    }

                    wpmfFoldersModule.wpmfTotalSize = parseInt(wpmfFoldersModule.wpmfTotalSize);
                    wpmfFoldersModule.wpmfTotalSize = wpmfFoldersModule.wpmfTotalSize + file_info.attributes.file.size;
                    $('.wpmf-upload-total-size').html(wpmfFoldersModule.formatBytes(wpmfFoldersModule.wpmfTotalSize));
                    if (parseInt(wpmf.vars.wpmf_post_type) !== 1 || !$('#wpb_visual_composer').is(":visible")) {
                        if (typeof wp.media.frame !== 'undefined' && typeof wp.media.frame._state !== 'undefined') {
                            var type = file_info.attributes.file.type;
                            var icon = '';
                            if (type.indexOf('image') != -1) {
                                icon = '<span class="wpmf-fileupload-thumbnail material-icons-outlined"> image </span>';
                            } else {
                                icon = '<span class="wpmf-fileupload-thumbnail material-icons-outlined"> description </span>';
                            }
                            var item = wpmfFoldersModule.getUploadItemTemplate(file_info.attributes.file.id, file_info.attributes.file.name, icon);
                            // Create the download attachment
                            if ($('.wpmf-process-body ul li').length) {
                                $('.wpmf-process-body ul').append(item);
                            } else {
                                $('.wpmf-process-body ul').html(item);
                            }
                        }
                    }
                });

                // Get upload progress infos
                var myMediaUploaderStatus = wp.media.view.UploaderStatus;
                if (typeof myMediaUploaderStatus !== "undefined") {
                    wp.media.view.UploaderStatus = wp.media.view.UploaderStatus.extend({
                        progress: function progress(file_info) {
                            // Call parent function
                            myMediaUploaderStatus.prototype.progress.apply(this, arguments);

                            // This is not a uploading update
                            if (file_info === undefined || file_info.changed === undefined || file_info.changed.percent === undefined) {
                                return;
                            }

                            if (typeof wp.media.frame !== 'undefined' && typeof wp.media.frame._state !== 'undefined' && wp.media.frame._state !== 'featured-image') {
                                // Update the uploaded percentage for this file
                                $('li.attachment[data-cid=' + file_info.attributes.file.id + '] .media-progress-bar > div').css({ 'width': file_info.changed.percent + '%' });
                            }

                            if (typeof wp.media.frame !== 'undefined' && typeof wp.media.frame._state !== 'undefined') {
                                // Update the uploaded percentage for this file
                                var file_id = file_info.attributes.file.id;
                                if (file_info.changed.percent >= 100) {
                                    $('.wpmf-process-file-item[data-cid=' + file_id + '] .wpmf-fileupload-progress-bar').css({ 'background': 'none' });
                                    $('.wpmf-process-file-item[data-cid=' + file_id + '] .wpmf-fileupload-progress-bar').html('<svg class="a-s-fa-Ha-pa c-qd" width="24px" height="24px" viewBox="0 0 24 24" fill="#0F9D58"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>');
                                    $('.wpmf-process-file-item[data-cid="' + file_id + '"]').removeClass('wpmf-uploading');
                                } else {
                                    $('.wpmf-process-file-item[data-cid=' + file_id + '] .wpmf-fileupload-progress-bar').css({ 'background': 'radial-gradient(closest-side, white 70%, transparent 80% 100%),    conic-gradient(#0073ab ' + file_info.changed.percent + '%, #ddd 0)' });
                                }
                            }
                        },
                        info: function info() {
                            myMediaUploaderStatus.prototype.info.apply(this, arguments);
                            var queue = this.queue,
                                index = 0,
                                active;

                            if (!queue.length) {
                                return;
                            }

                            active = this.queue.find(function (attachment, i) {
                                index = i;
                                return attachment.get('uploading');
                            });

                            var total = wpmfFoldersModule.filesTotal + queue.length;
                            if (this.$index && this.$total && this.$filename) {
                                $('.wpmf-upload-completed').text(index + 1);
                                $('.wpmf-upload-total').text(total);
                            }
                            var completed = $('.wpmf-upload-completed').html();
                            if (completed == '') {
                                completed = 0;
                            }
                            var completed_process = parseInt(completed) / total * 100;
                            $('.wpmf-process-head-bar').css('width', completed_process + '%');
                        },
                        error: function error(_error) {
                            if (_error.get('message') === wpmf.l18n.error_replace) {
                                $('.upload-errors').addClass('wpmferror_replace');
                                wp.Uploader.queue.reset();
                            }
                            myMediaUploaderStatus.prototype.error.apply(this, arguments);
                        }
                    });
                }
            }

            wpmfFoldersModule.trigger('afterFiltersInitialization');
        },

        formatBytes: function formatBytes(bytes) {
            var decimals = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;

            if (!+bytes) return '0 Bytes';
            var k = 1024;
            var dm = decimals < 0 ? 0 : decimals;
            var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            var i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        },

        /**
         * Get backbone of media
         */
        getBackboneOfMedia: function getBackboneOfMedia() {
            var c = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            var t = void 0,
                a = void 0,
                n = wpmfFoldersModule.getFrame().parents(".media-modal:visible");
            return a = ((t = n.length > 0 && !c) ? n.find(".attachments-browser") : $(".media-frame-content .attachments-browser")).data("backboneView"), {
                browser: $('.attachments-browser'),
                view: a
            };
        },

        /**
         * Create the folder/taxonomy filtering
         */
        initFolderFilter: function initFolderFilter() {
            /**
             * We extend the AttachmentFilters view to add our own filtering
             */
            if (typeof wp.media !== 'undefined' && typeof wp.media.view !== 'undefined' && typeof wp.media.view.AttachmentFilters !== "undefined") {
                wp.media.view.AttachmentFilters['wpmf_categories'] = wp.media.view.AttachmentFilters.extend({
                    className: 'wpmf-media-categories attachment-filters',
                    id: 'wpmf-media-category',
                    createFilters: function createFilters() {
                        var filters = {};
                        var ij = 0;
                        var space = '&nbsp;&nbsp;';
                        _.each(wpmfFoldersModule.categories_order || [], function (key) {
                            var term = wpmfFoldersModule.categories[key];
                            if (typeof term !== "undefined") {
                                if (parseInt(wpmfFoldersModule.media_root) !== parseInt(term.id)) {
                                    var query = {
                                        taxonomy: wpmfFoldersModule.taxonomy,
                                        term_id: parseInt(term.id, 10),
                                        term_slug: term.slug,
                                        wpmf_taxonomy: 'true',
                                        wpmf_nonce: wpmf.vars.wpmf_nonce
                                    };

                                    if (typeof term.depth === 'undefined') {
                                        term.depth = 0;
                                    }

                                    filters[ij] = {
                                        text: space.repeat(term.depth) + term.label,
                                        props: query
                                    };

                                    wpmfFoldersModule.relation_category_filter[term.id] = ij;
                                    wpmfFoldersModule.relation_filter_category[ij] = term.id;
                                    ij++;
                                }
                            }
                        });

                        this.filters = filters;
                    }
                });
            }

            // render filter
            if (typeof wp.media !== "undefined" && typeof wp.media.view !== "undefined" && typeof wp.media.view.AttachmentsBrowser !== "undefined") {
                var myAttachmentsBrowser = wp.media.view.AttachmentsBrowser;
            }
            if (typeof myAttachmentsBrowser !== "undefined") {
                wp.media.view.AttachmentsBrowser = wp.media.view.AttachmentsBrowser.extend({

                    createToolbar: function createToolbar() {
                        this.$el.data("backboneView", this);
                        wp.media.model.Query.defaultArgs.filterSource = 'filter-attachment-category';
                        myAttachmentsBrowser.prototype.createToolbar.apply(this, arguments);
                        //Save the attachments because we'll need it to change the category filter
                        wpmfFoldersModule.attachments_browser = this;

                        this.toolbar.set(wpmfFoldersModule.taxonomy, new wp.media.view.AttachmentFilters['wpmf_categories']({
                            controller: this.controller,
                            model: this.collection.props,
                            priority: -75
                        }).render());
                    },

                    // Add video icon for each remote video attachment
                    updateContent: function updateContent() {
                        myAttachmentsBrowser.prototype.updateContent.apply(this, arguments);
                        wpmfFoldersModule.getFrame().find('.attachments-browser .attachment').each(function (i, v) {
                            var id_img = $(v).data('id');
                            if (parseInt(wp.media.attachment(id_img).get('is_video')) === 1) {
                                if ($('li.attachment[data-id="' + id_img + '"] .attachment-preview .wpmf_remote_video').length === 0) {
                                    $('li.attachment[data-id="' + id_img + '"] .attachment-preview').append('<i class="material-icons wpmf_remote_video">play_circle_filled</i>');
                                }
                            }
                        });
                    }
                });
            }

            // If the filter has already been rendered, force it to be reloaded
            if (wpmfFoldersModule.attachments_browser !== null) {
                // Remove previous filter
                wpmfFoldersModule.getFrame().find('#wpmf-media-category').remove();

                // Regenerate filter
                wpmfFoldersModule.attachments_browser.toolbar.set(wpmfFoldersModule.taxo, new wp.media.view.AttachmentFilters['wpmf_categories']({
                    controller: wpmfFoldersModule.attachments_browser.controller,
                    model: wpmfFoldersModule.attachments_browser.collection.props,
                    priority: -75
                }).render());
                wpmfFoldersModule.initLoadingFolder();
            }

            // order image gallery
            if (typeof wp.media !== "undefined" && typeof wp.media.controller !== "undefined" && typeof wp.media.controller.GalleryEdit !== "undefined") {
                var myMediaControllerGalleryEdit = wp.media.controller.GalleryEdit;
            }
            if (typeof myMediaControllerGalleryEdit !== "undefined") {
                wp.media.controller.GalleryEdit = wp.media.controller.GalleryEdit.extend({
                    gallerySettings: function gallerySettings(browser) {
                        // Apply original method
                        myMediaControllerGalleryEdit.prototype.gallerySettings.apply(this, arguments);
                        var library = this.get('library');
                        browser.toolbar.set('wpmf_reverse_gallery', {
                            text: 'Order by',
                            priority: 70,
                            click: function click() {
                                /* Sort images gallery by setting */
                                var lists_i = library.toArray();
                                var listsId = [];
                                var wpmf_orderby = $('.wpmf_orderby').val();
                                var wpmf_order = $('.wpmf_order').val();
                                $.each(lists_i, function (i, v) {
                                    listsId.push(v.id);
                                });

                                var wpmf_img_order = [];
                                $.ajax({
                                    method: "POST",
                                    dataType: 'json',
                                    url: wpmf.vars.ajaxurl,
                                    data: {
                                        action: "wpmf",
                                        ids: listsId,
                                        wpmf_orderby: wpmf_orderby,
                                        wpmf_order: wpmf_order,
                                        task: "gallery_get_image",
                                        wpmf_nonce: wpmf.vars.wpmf_nonce
                                    },
                                    success: function success(res) {
                                        if (res !== false) {
                                            $.each(res, function (i, v) {
                                                $.each(lists_i, function (k, h) {
                                                    if (h.id === v.ID) wpmf_img_order.push(h);
                                                });
                                            });

                                            library.reset(wpmf_img_order);
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            }

            // Reload folders after searching
            if (typeof wp.media !== "undefined" && typeof wp.media.view !== "undefined" && typeof wp.media.view.Search !== "undefined") {
                var mySearch = wp.media.view.Search;
            }
            var search_initialized = false;
            if (typeof mySearch !== "undefined") {
                wp.media.view.Search = wp.media.view.Search.extend({
                    search: function search(event) {
                        // Apply original method
                        mySearch.prototype.search.apply(this, arguments);
                        // Register on change event if not already done
                        if (!search_initialized) {
                            this.model.on('change', function () {
                                wpmfFoldersModule.renderFolders();
                            });

                            // Prevent to register the function on the event each time search is called
                            search_initialized = true;
                        }
                    }
                });
            }
        },

        setFolderOrdering: function setFolderOrdering(ordering) {
            wpmfFoldersModule.folder_ordering = ordering;
            // Rerender folders
            wpmfFoldersModule.renderFolders();
        },

        /**
         * Force attachments to be reloaded in the current view
         */
        reloadAttachments: function reloadAttachments() {
            var c = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            // Force reloading files
            var n = wpmfFoldersModule.getBackboneOfMedia(c);
            if (n.browser.length > 0 && "object" == _typeof(n.view)) try {
                n.view.collection.props.set({ ignore: +new Date() });
            } catch (e) {}
            $("#wpmf_preview_image").remove();
        },

        /**
         * Initialize the events on which the folders should be reloaded
         */
        initLoadingFolder: function initLoadingFolder() {
            wpmfFoldersModule.getFrame().find('#wpmf-media-category').on('change', function () {
                if (wpmfFoldersModule.page_type === 'upload-list') {
                    // In list view submit filter form
                    $('.upload-php #posts-filter').submit();
                } else {
                    wpmfFoldersModule.renderFolders(wpmfFoldersModule.relation_filter_category[$(this).val()]);
                    wpmfFoldersModule.updateBreadcrumb(wpmfFoldersModule.relation_filter_category[$(this).val()]);

                    // set cookie last access folder
                    if (typeof wpmfFoldersModule.relation_filter_category[$(this).val()] === "undefined") {
                        wpmfFoldersModule.setCookie('lastAccessFolder_' + wpmf.vars.host, 0, 365);
                    } else {
                        wpmfFoldersModule.setCookie('lastAccessFolder_' + wpmf.vars.host, wpmfFoldersModule.relation_filter_category[$(this).val()], 365);
                    }

                    // Trigger change changeFolder event for other modules
                    wpmfFoldersModule.trigger('changeFolder', wpmfFoldersModule.relation_filter_category[$(this).val()]);
                }
            });
        },

        /**
         * set a cookie
         * @param cname cookie name
         * @param cvalue cookie value
         * @param exdays
         */
        setCookie: function setCookie(cname, cvalue, exdays) {
            var d = new Date();
            d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
            var expires = "expires=" + d.toUTCString();
            document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
        },

        /**
         * get a cookie
         * @param cname cookie name
         * @returns {*}
         */
        getCookie: function getCookie(cname) {
            var name = cname + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) === ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) === 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return "";
        },

        /**
         * Move into the term_id folder
         * It will change the selected option in the filter
         * This will update the attachments and render the folders
         *
         * @param term_id
         */
        changeFolder: function changeFolder(term_id) {
            // set cookie last access folder
            if (typeof term_id === "undefined") {
                wpmfFoldersModule.setCookie('lastAccessFolder_' + wpmf.vars.host, 0, 365);
            } else {
                wpmfFoldersModule.setCookie('lastAccessFolder_' + wpmf.vars.host, term_id, 365);
            }

            // Select the filter folder
            if (wpmfFoldersModule.page_type === 'upload-list') {
                wpmfFoldersModule.getFrame().find('#wpmf-media-category').val(term_id).trigger('change');
            } else {
                wpmfFoldersModule.getFrame().find('#wpmf-media-category').val(wpmfFoldersModule.relation_category_filter[term_id]).trigger('change');
            }

            $('#menu-media li a[href^="media-new.php"]').attr('href', wpmf.vars.media_new_url + '?wpmf-folder=' + term_id);
            $("#wpmf_preview_image").remove();
            if (wpmfFoldersModule.page_type !== 'upload-list') {
                if (wpmfFoldersModule.getFrame().find('.wpmf-order-media').val() === 'custom' || !wpmfFoldersModule.reload_attachment) {
                    wpmfFoldersModule.reloadAttachments();
                    wpmfFoldersModule.reload_attachment = true;
                }
            }
        },

        /**
         * Generate the html tag for a folder attachment
         *
         * @param type string type of folder
         * @param name string folder name
         * @param term_id int folder term id
         * @param parent_id int folder parent id
         *
         * @return {string} the string that contains the single folder attachment rendered
         */
        getFolderRendering: function getFolderRendering(type, name, term_id, parent_id) {
            var buttons = '';
            var class_names = '';
            var main_icon = '';
            var action = '';
            if (type === 'folder') {
                // This is a folder
                buttons = '<span class="dashicons dashicons-edit" onclick="wpmfFoldersModule.clickEditFolder(event, ' + term_id + ')"></span>\n                            <span class="dashicons dashicons-trash" onclick="wpmfFoldersModule.clickDeleteFolder(event, ' + term_id + ')"></span>';
                class_names = 'wpmf-folder';
                action = 'onclick="wpmfFoldersModule.changeFolder(' + term_id + ');"';
                main_icon = '<i class="material-icons wpmf-icon-category">folder</i>';
                if (wpmfFoldersModule.categories[term_id].drive_type === 'google_drive') {
                    main_icon = '<i class="zmdi zmdi-google-drive wpmf-icon-category"></i>';
                    class_names += ' wpmf_drive_folder';
                }

                if (wpmfFoldersModule.categories[term_id].drive_type === 'dropbox') {
                    main_icon = '<i class="zmdi zmdi-dropbox wpmf-icon-category"></i>';
                    class_names += ' wpmf_drive_folder';
                }

                var odvColor = '#8f8f8f';
                if (wpmfFoldersModule.categories[term_id].drive_type === 'onedrive' || wpmfFoldersModule.categories[term_id].drive_type === 'onedrive_business') {
                    if (typeof wpmf.vars.colors !== 'undefined' && typeof wpmf.vars.colors[term_id] !== 'undefined' && type === 'folder') {
                        odvColor = wpmf.vars.colors[term_id];
                    }
                }

                if (wpmfFoldersModule.categories[term_id].drive_type === 'onedrive') {
                    main_icon = '<svg class="wpmf-icon-category" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60.43 35.95"><defs></defs><title>icon</title><path class="cls-1" d="M39.45,36.6H55.53a5.41,5.41,0,0,0,5.15-2.77c1.75-3.14,1.41-8.69-3.72-10.35-.55-.18-.91-.27-.93-1-.13-6.16-6.1-9.95-12.23-7.73a1.21,1.21,0,0,1-1.65-.47,10,10,0,0,0-8.49-4c-5.29.2-8.84,3.31-10.08,8.57a1.9,1.9,0,0,1-1.84,1.73c-3.41.53-6.06,2.74-6.43,5.52-.77,5.7,1.55,10.47,8.49,10.51C29,36.62,34.23,36.6,39.45,36.6Z" transform="translate(-1.2 -0.66)" style="fill:#fefefe"/><path class="cls-1" d="M14.58,34c-.23-.54-.4-.93-.55-1.31-2.29-5.83-.42-11.5,6.08-13.45a2.7,2.7,0,0,0,2.06-2.13,12.4,12.4,0,0,1,11.89-8.7,11,11,0,0,1,8.49,3.83c.35.4.66,1,1.4.6a6.16,6.16,0,0,1,2.49-.57c.92-.12,1.08-.45.85-1.31-1.52-5.74-5.24-9.23-11-10.15C31.12,0,26.9,2,24,6.43a1.12,1.12,0,0,1-1.72.47,8.52,8.52,0,0,0-5.6-.59C11.73,7.41,8.76,11,8.49,16.37c0,.9-.22,1.14-1.1,1.36A7.92,7.92,0,0,0,1.22,25,8.39,8.39,0,0,0,5.6,33C8.43,34.53,11.46,33.83,14.58,34Z" transform="translate(-1.2 -0.66)" style="fill: #fefefe"/><path class="cls-2" d="M39.45,36.6c-5.22,0-10.43,0-15.65,0-6.94,0-9.26-4.81-8.49-10.51.37-2.78,3-5,6.43-5.52a1.9,1.9,0,0,0,1.84-1.73c1.24-5.26,4.79-8.37,10.08-8.57a10,10,0,0,1,8.49,4,1.21,1.21,0,0,0,1.65.47c6.13-2.22,12.1,1.57,12.23,7.73,0,.72.38.81.93,1,5.13,1.66,5.47,7.21,3.72,10.35a5.41,5.41,0,0,1-5.15,2.77Z" transform="translate(-1.2 -0.66)" style="fill: ' + odvColor + '"/><path class="cls-2" d="M14.58,34c-3.12-.2-6.15.5-9-1.07a8.39,8.39,0,0,1-4.38-8,7.92,7.92,0,0,1,6.17-7.25c.88-.22,1.06-.46,1.1-1.36.27-5.35,3.24-9,8.17-10.06a8.52,8.52,0,0,1,5.6.59A1.12,1.12,0,0,0,24,6.43C26.9,2,31.12,0,36.28.84c5.77.92,9.49,4.41,11,10.15.23.86.07,1.19-.85,1.31a6.16,6.16,0,0,0-2.49.57c-.74.44-1.05-.2-1.4-.6a11,11,0,0,0-8.49-3.83,12.4,12.4,0,0,0-11.89,8.7,2.7,2.7,0,0,1-2.06,2.13c-6.5,1.95-8.37,7.62-6.08,13.45C14.18,33.1,14.35,33.49,14.58,34Z" transform="translate(-1.2 -0.66)" style="fill: ' + odvColor + '"/></svg>';
                    class_names += ' wpmf_drive_folder';
                }

                if (wpmfFoldersModule.categories[term_id].drive_type === 'onedrive_business') {
                    main_icon = '<svg class="wpmf-icon-category" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60.43 35.95"><defs></defs><title>icon</title><path class="cls-1" d="M39.45,36.6H55.53a5.41,5.41,0,0,0,5.15-2.77c1.75-3.14,1.41-8.69-3.72-10.35-.55-.18-.91-.27-.93-1-.13-6.16-6.1-9.95-12.23-7.73a1.21,1.21,0,0,1-1.65-.47,10,10,0,0,0-8.49-4c-5.29.2-8.84,3.31-10.08,8.57a1.9,1.9,0,0,1-1.84,1.73c-3.41.53-6.06,2.74-6.43,5.52-.77,5.7,1.55,10.47,8.49,10.51C29,36.62,34.23,36.6,39.45,36.6Z" transform="translate(-1.2 -0.66)" style="fill:#fefefe"/><path class="cls-1" d="M14.58,34c-.23-.54-.4-.93-.55-1.31-2.29-5.83-.42-11.5,6.08-13.45a2.7,2.7,0,0,0,2.06-2.13,12.4,12.4,0,0,1,11.89-8.7,11,11,0,0,1,8.49,3.83c.35.4.66,1,1.4.6a6.16,6.16,0,0,1,2.49-.57c.92-.12,1.08-.45.85-1.31-1.52-5.74-5.24-9.23-11-10.15C31.12,0,26.9,2,24,6.43a1.12,1.12,0,0,1-1.72.47,8.52,8.52,0,0,0-5.6-.59C11.73,7.41,8.76,11,8.49,16.37c0,.9-.22,1.14-1.1,1.36A7.92,7.92,0,0,0,1.22,25,8.39,8.39,0,0,0,5.6,33C8.43,34.53,11.46,33.83,14.58,34Z" transform="translate(-1.2 -0.66)" style="fill: #fefefe"/><path class="cls-2" d="M39.45,36.6c-5.22,0-10.43,0-15.65,0-6.94,0-9.26-4.81-8.49-10.51.37-2.78,3-5,6.43-5.52a1.9,1.9,0,0,0,1.84-1.73c1.24-5.26,4.79-8.37,10.08-8.57a10,10,0,0,1,8.49,4,1.21,1.21,0,0,0,1.65.47c6.13-2.22,12.1,1.57,12.23,7.73,0,.72.38.81.93,1,5.13,1.66,5.47,7.21,3.72,10.35a5.41,5.41,0,0,1-5.15,2.77Z" transform="translate(-1.2 -0.66)" style="fill: ' + odvColor + '"/><path class="cls-2" d="M14.58,34c-3.12-.2-6.15.5-9-1.07a8.39,8.39,0,0,1-4.38-8,7.92,7.92,0,0,1,6.17-7.25c.88-.22,1.06-.46,1.1-1.36.27-5.35,3.24-9,8.17-10.06a8.52,8.52,0,0,1,5.6.59A1.12,1.12,0,0,0,24,6.43C26.9,2,31.12,0,36.28.84c5.77.92,9.49,4.41,11,10.15.23.86.07,1.19-.85,1.31a6.16,6.16,0,0,0-2.49.57c-.74.44-1.05-.2-1.4-.6a11,11,0,0,0-8.49-3.83,12.4,12.4,0,0,0-11.89,8.7,2.7,2.7,0,0,1-2.06,2.13c-6.5,1.95-8.37,7.62-6.08,13.45C14.18,33.1,14.35,33.49,14.58,34Z" transform="translate(-1.2 -0.66)" style="fill: ' + odvColor + '"/></svg>';
                    class_names += ' wpmf_drive_folder';
                }

                if (wpmfFoldersModule.categories[term_id].drive_type === 'nextcloud') {
                    main_icon = '<svg class="wpmf-icon-category" version="1.1" viewBox="0 0 256 128" xmlns="http://www.w3.org/2000/svg"><path d="m128 7c-25.871 0-47.817 17.485-54.713 41.209-5.9795-12.461-18.642-21.209-33.287-21.209-20.304 0-37 16.696-37 37s16.696 37 37 37c14.645 0 27.308-8.7481 33.287-21.209 6.8957 23.724 28.842 41.209 54.713 41.209s47.817-17.485 54.713-41.209c5.9795 12.461 18.642 21.209 33.287 21.209 20.304 0 37-16.696 37-37s-16.696-37-37-37c-14.645 0-27.308 8.7481-33.287 21.209-6.8957-23.724-28.842-41.209-54.713-41.209zm0 22c19.46 0 35 15.54 35 35s-15.54 35-35 35-35-15.54-35-35 15.54-35 35-35zm-88 20c8.4146 0 15 6.5854 15 15s-6.5854 15-15 15-15-6.5854-15-15 6.5854-15 15-15zm176 0c8.4146 0 15 6.5854 15 15s-6.5854 15-15 15-15-6.5854-15-15 6.5854-15 15-15z" color="#000000" fill="#0082c9" style="-inkscape-stroke:none"/></svg>';
                    class_names += ' wpmf_drive_folder';
                }

                if (wpmfFoldersModule.categories[term_id].drive_type !== 'google_drive' && wpmfFoldersModule.categories[term_id].drive_type !== 'dropbox' && wpmfFoldersModule.categories[term_id].drive_type !== 'onedrive' && wpmfFoldersModule.categories[term_id].drive_type !== 'onedrive_business' && wpmfFoldersModule.categories[term_id].drive_type !== 'nextcloud') {
                    class_names += ' wpmf_local_media';
                }
            } else if (type === 'back') {
                // This is a back folder
                class_names = 'wpmf-folder wpmf-back';
                main_icon = '<span class="material-icons"> keyboard_arrow_left </span>';
                action = 'onclick="wpmfFoldersModule.changeFolder(' + term_id + ');"';
            } else if (type === 'new') {
                // This is a create new folder button
                class_names = 'wpmf-new';
                main_icon = '<i class="material-icons wpmf-icon-category">create_new_folder</i>';
                action = 'onclick="wpmfFoldersModule.newFolder(' + term_id + ');"';
            } else if (type === 'line break') {
                class_names = 'wpmf-line-break';
            }

            // get color folder
            var bgcolor = 'color: #8f8f8f';
            if (typeof wpmf.vars.colors !== 'undefined' && typeof wpmf.vars.colors[term_id] !== 'undefined' && type === 'folder') {
                bgcolor = 'color: ' + wpmf.vars.colors[term_id];
            }

            if (class_names === 'wpmf-line-break') {
                return '<li class="wpmf-line-break"></li>';
            }

            return '<li class="mdc-list-item attachment wpmf-attachment material_design ' + class_names + ' mdc-ripple-upgraded"\n                data-parent_id="' + parent_id + '" \n                data-id="' + term_id + '"\n                ' + action + '\n            >\n            <span class="mdc-list-item__start-detail" style="' + bgcolor + '">\n              ' + main_icon + '\n            </span>\n                <span class="mdc-list-item__text" title="' + name + '">\n              ' + name + '\n            </span>\n            </li>';
        },

        /**
         * Update count files in folder
         * @param term_id
         */
        updateCountFiles: function updateCountFiles(term_id) {
            $.ajax({
                type: "POST",
                url: wpmf.vars.ajaxurl,
                data: {
                    action: "wpmf",
                    task: "getcountfiles",
                    term_id: term_id,
                    wpmf_nonce: wpmf.vars.wpmf_nonce
                },
                success: function success(response) {
                    if (response.status) {
                        wpmfFoldersModule.categories[term_id].files_count = parseInt(response.count);
                        wpmfFoldersModule.trigger('foldersCountChanged');
                    }
                }
            });
        },

        /**
         * Render the folders to the attachments listing
         *
         * @param term_id
         */
        renderFolders: function renderFolders(term_id) {
            if (parseInt(wpmfFoldersModule.enable_folders) === 0) {
                // return if disable show folders option
                return;
            }

            if (typeof term_id === "undefined") {
                // check if enable display own media
                if (typeof wpmfFoldersModule.categories[wpmfFoldersModule.last_selected_folder] === "undefined") {
                    wpmfFoldersModule.last_selected_folder = 0;
                    wpmfFoldersModule.changeFolder(0);
                }

                term_id = wpmfFoldersModule.last_selected_folder;
            } else {
                // Let's save this term as the last used one
                wpmfFoldersModule.last_selected_folder = term_id;
            }

            // Retrieve current frame
            var $frame = wpmfFoldersModule.getFrame();

            // Retrieve the attachments container
            var $attachments_container = void 0;
            if (wpmfFoldersModule.page_type === 'upload-list') {
                $attachments_container = $frame.find('ul.attachments');
            } else {
                $attachments_container = $frame.find('.attachments-browser ul.attachments');
            }

            // Remove previous folders
            $attachments_container.find('.wpmf-attachment, .wpmf-line-break').remove();

            // Retrieve the folders that may be added to current view
            var folders_ordered = [];
            // get search keyword
            var search = $('.wpmf_search_folder').val();
            wpmfFoldersModule.folder_search = [];
            if (typeof search === "undefined") {
                search = '';
            } else {
                search = search.trim().toLowerCase();
            }

            for (var folder_id in wpmfFoldersModule.categories) {
                if (search === '') {
                    if (wpmfFoldersModule.categories[folder_id].id !== 0 && // We don't show the root folder
                    wpmfFoldersModule.categories[folder_id].parent_id === term_id // We only show folders of the current parent
                    ) {
                            folders_ordered.push(wpmfFoldersModule.categories[folder_id]);
                        }
                } else {
                    search = search.trim().toLowerCase();
                    var folder_name = wpmfFoldersModule.categories[folder_id].lower_label;
                    // check folder name with search keyword
                    if (folder_name.indexOf(search) !== -1 && wpmfFoldersModule.categories[folder_id].parent_id === term_id && wpmfFoldersModule.categories[folder_id].id !== 0) {
                        folders_ordered.push(wpmfFoldersModule.categories[folder_id]);
                    }

                    if (folder_name.indexOf(search) !== -1) {
                        wpmfFoldersModule.folder_search.push(folder_id);
                    }
                }
            }

            var folder_order = wpmfFoldersModule.getCookie('media-order-folder' + wpmf.vars.host);
            if (typeof folder_order !== "undefined") {
                wpmfFoldersModule.folder_ordering = folder_order;
            }

            // Order folders
            switch (wpmfFoldersModule.folder_ordering) {
                default:
                case 'name-ASC':
                    folders_ordered = folders_ordered.sort(function (a, b) {
                        return a.label.localeCompare(b.label);
                    });
                    break;
                case 'name-DESC':
                    folders_ordered = folders_ordered.sort(function (a, b) {
                        return b.label.localeCompare(a.label);
                    });
                    break;
                case 'id-ASC':
                    folders_ordered = folders_ordered.sort(function (a, b) {
                        return a.id - b.id;
                    });
                    break;
                case 'id-DESC':
                    folders_ordered = folders_ordered.sort(function (a, b) {
                        return b.id - a.id;
                    });
                    break;
                case 'custom':
                    folders_ordered = folders_ordered.sort(function (a, b) {
                        return a.order - b.order;
                    });
                    break;
            }

            // Add each folder to the attachments listing
            $(folders_ordered).each(function () {
                // Get the formatted folder for the attachment listing
                if (parseInt(wpmf.vars.hide_tree) === 1) {
                    if (this.drive_type === '' || this.drive_type !== '' && parseInt(this.parent_id) !== 0) {
                        var folder = wpmfFoldersModule.getFolderRendering('folder', this.label, this.id, this.parent_id);
                        // Add the folder to the attachment listing
                        $attachments_container.append(folder);
                    }
                } else {
                    var _folder = wpmfFoldersModule.getFolderRendering('folder', this.label, this.id, this.parent_id);
                    // Add the folder to the attachment listing
                    $attachments_container.append(_folder);
                }
            });

            if (parseInt(wpmf.vars.hide_tree) === 0) {
                // Get the formatted new button
                var folder = wpmfFoldersModule.getFolderRendering('new', wpmf.l18n['create_folder'], term_id, '');

                // Add the new folder button to the attachment listing
                $attachments_container.prepend(folder);
            }

            // Get the formatted folder to use as a line break
            var line_break = wpmfFoldersModule.getFolderRendering('line break', '', '', '');

            // Add the folder to the attachment listing
            $attachments_container.append(line_break);
            if ($('.display-all-media .check').length) {
                $('.attachments .wpmf-attachment').hide();
            } else {
                $('.attachments .wpmf-attachment').show();
            }
            $('.wpmf_id_category').val(wpmfFoldersModule.last_selected_folder).change();
            if ($('.wpmf_btn_upload_folder').length && !$('.wpmf_btn_upload_folder input').length) {
                var wpmfUploader = new Resumable({
                    target: wpmf.vars.ajaxurl + '?action=wpmf_upload_folder',
                    query: {
                        id_category: $('input[name=id_category]').val()
                    },
                    fileParameterName: 'file_upload',
                    simultaneousUploads: 1,
                    maxChunkRetries: 1,
                    maxFileSize: 100 * 1024 * 1024,
                    maxFileSizeErrorCallback: function maxFileSizeErrorCallback(file) {},
                    chunkSize: wpmf.vars.serverUploadLimit - 50 * 1024, // Reduce 50KB to avoid error
                    forceChunkSize: true,
                    //fileType: allowedExt,
                    fileTypeErrorCallback: function fileTypeErrorCallback(file) {},
                    generateUniqueIdentifier: function generateUniqueIdentifier(file, event) {
                        if (file.hasOwnProperty('uniqueIdentifier')) {
                            return file.uniqueIdentifier;
                        }
                        var relativePath = file.webkitRelativePath || file.fileName || file.name;
                        var size = file.size;
                        var prefix = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                        var catId = wpmfFoldersModule.last_selected_folder;
                        if (file.hasOwnProperty('catId')) {
                            catId = file.catId;
                        }
                        return catId + '|||' + prefix + size + '-' + relativePath.replace(/[^0-9a-zA-Z_-]/img, '');
                    }
                });

                wpmfUploader.assignBrowse($('.wpmf_btn_upload_folder'), true);
                wpmfUploader.on('createFolders', function (files) {
                    wpmfFoldersModule.filesTotal += files.length;
                });
                wpmfUploader.on('filesAdded', function (files) {
                    if (files.length > 0) {
                        var breadcrumb = [];
                        $('#wpmf-breadcrumb li').each(function (i, v) {
                            if (i > 0) {
                                var item = $(v).find('a').html();
                                breadcrumb.push(item);
                            }
                        });

                        breadcrumb = breadcrumb.join('/');
                        wpmfUploader.opts.query = {
                            id_category: $('input[name=id_category]').val()
                        };

                        if (!$('.wpmf-process-lists').length) {
                            $('body').append('\n                        <div class="wpmf-process-lists">\n    <div class="wpmf-process-head">\n    <span class="wpmf-process-head-bar"></span>\n        <span class="wpmf-upload-head-text"><span>' + wpmf.l18n.uploaded + ' <span class="wpmf-upload-completed">0</span> / <span class="wpmf-upload-total">0</span><br><span class="wpmf-upload-head-time">' + wpmf.l18n.upload_text + '</span></span>\n        </span>\n        <div class="wpmf-head-upload-actions"><span class="material-icons-outlined wpmf-head-upload-action-expand"> expand_more </span><span class="material-icons-outlined wpmf-head-upload-action-close"> close </span></div>\n    </div>\n    <div class="wpmf-process-body">\n        <ul></ul>\n    </div>\n    <div class="wpmf-process-foot"><span>' + wpmf.l18n.total_size + '&nbsp;</span><span class="wpmf-upload-total-size">0</span></div>\n</div>\n                        ');

                            $('.wpmf-head-upload-action-close').unbind('click').bind('click', function () {
                                $('.wpmf-process-lists').remove();
                            });

                            $('.wpmf-head-upload-action-expand').unbind('click').bind('click', function () {
                                $('.wpmf-process-body').toggleClass('hide');
                            });
                        }

                        if (parseInt(wpmf.vars.wpmf_post_type) !== 1 || !$('#wpb_visual_composer').is(":visible")) {
                            if (typeof wp.media !== 'undefined' && typeof wp.media.frame !== 'undefined' && typeof wp.media.frame._state !== 'undefined') {
                                var first_file = files[0];
                                var relativePath = first_file.relativePath;
                                var relativePaths = relativePath.split('/');
                                var _folder_name = wpmfFoldersModule.string_to_slug(relativePaths[0]);
                                if (!$('.wpmf-process-file-item[data-cid="' + _folder_name + '"]').length) {
                                    var icon = '<span class="wpmf-fileupload-thumbnail material-icons-outlined"> folder </span>';
                                    var item = wpmfFoldersModule.getUploadItemTemplate(_folder_name, _folder_name, icon);
                                    // Create the download attachment
                                    if ($('.wpmf-process-body ul li').length) {
                                        $('.wpmf-process-body ul').append(item);
                                    } else {
                                        $('.wpmf-process-body ul').html(item);
                                    }
                                }

                                $.each(files, function (i, v) {
                                    wpmfFoldersModule.wpmfTotalSize = parseInt(wpmfFoldersModule.wpmfTotalSize);
                                    wpmfFoldersModule.wpmfTotalSize = wpmfFoldersModule.wpmfTotalSize + v.file.size;
                                });

                                $('.wpmf-upload-total').html(parseInt(wpmfFoldersModule.filesTotal));
                                $('.wpmf-upload-total-size').html(wpmfFoldersModule.formatBytes(wpmfFoldersModule.wpmfTotalSize));
                            }
                        }

                        wpmfUploader.upload();
                    }
                });
                wpmfUploader.on('fileProgress', function (file) {});
                wpmfUploader.on('fileError', function (file, msg) {});
                wpmfUploader.on('fileSuccess', function (file, res) {
                    try {
                        var index = $('.wpmf-upload-completed').html();
                        if (index == '') {
                            index = 0;
                        }

                        var completed = parseInt(index) + 1;
                        if (completed <= parseInt(wpmfFoldersModule.filesTotal)) {
                            $('.wpmf-upload-completed').text(completed);
                            var percent = completed / parseInt(wpmfFoldersModule.filesTotal) * 100;
                            if (parseInt(percent) > 100) {
                                percent = 100;
                            }

                            var relativePath = file.relativePath;
                            var relativePaths = relativePath.split('/');
                            var _folder_name2 = wpmfFoldersModule.string_to_slug(relativePaths[0]);
                            if (percent == 100) {
                                $('.wpmf-process-file-item[data-cid="' + _folder_name2 + '"] .wpmf-fileupload-progress-bar').css({ 'background': 'none' });
                                $('.wpmf-process-file-item[data-cid="' + _folder_name2 + '"] .wpmf-fileupload-progress-bar').html('<svg class="a-s-fa-Ha-pa c-qd" width="24px" height="24px" viewBox="0 0 24 24" fill="#0F9D58"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>');
                                $('.wpmf-process-file-item[data-cid="' + _folder_name2 + '"]').removeClass('wpmf-uploading');
                            } else {
                                $('.wpmf-process-file-item[data-cid=' + _folder_name2 + '] .wpmf-fileupload-progress-bar').css({ 'background': 'radial-gradient(closest-side, white 70%, transparent 80% 100%),    conic-gradient(#0073ab ' + percent + '%, #ddd 0)' });
                            }
                            $('.wpmf-process-head-bar').css('width', percent + '%');
                        }
                    } catch (e) {}
                });
                wpmfUploader.on('complete', function () {
                    var completed = $('.wpmf-upload-completed').html();
                    if (completed == '') {
                        completed = 0;
                    }

                    if (parseInt(completed) >= wpmfFoldersModule.filesTotal) {
                        $('.wpmf-process-lists').remove();
                        wpmfFoldersModule.wpmfTotalSize = 0;
                        wpmfFoldersModule.filesTotal = 0;
                    }

                    wpmfSnackbarModule.show({
                        id: 'upload_completed',
                        content: wpmf.l18n.folder_uploaded,
                        auto_close_delay: 3000
                    });

                    $.ajax({
                        type: "POST",
                        url: wpmf.vars.ajaxurl,
                        data: {
                            action: "wpmf",
                            task: "reload_folder_tree",
                            wpmf_nonce: wpmf.vars.wpmf_nonce
                        },
                        success: function success(response) {
                            if (response.status) {
                                wpmfFoldersModule.categories = response.categories;
                                wpmfFoldersModule.categories_order = response.categories_order;

                                // Regenerate the folder filter
                                wpmfFoldersModule.initFolderFilter();

                                // Reload the folders
                                wpmfFoldersModule.renderFolders();
                                wpmfFoldersModule.trigger('addFolder', '');
                            }
                        }
                    });
                });
            }
        },

        string_to_slug: function string_to_slug(str) {
            str = str.replace(/^\s+|\s+$/g, ''); // trim
            str = str.toLowerCase();

            // remove accents, swap ñ for n, etc
            var from = "àáäâèéëêìíïîòóöôùúüûñçěščřžýúůďťň·/_,:;";
            var to = "aaaaeeeeiiiioooouuuuncescrzyuudtn------";

            for (var i = 0, l = from.length; i < l; i++) {
                str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
            }

            str = str.replace('.', '-') // replace a dot by a dash
            .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
            .replace(/\s+/g, '-') // collapse whitespace and replace by a dash
            .replace(/-+/g, '-') // collapse dashes
            .replace(/\//g, ''); // collapse all forward-slashes

            return str;
        },

        getUploadItemTemplate: function getUploadItemTemplate(id, name, icon) {
            return '<li data-cid="' + id + '" class="wpmf-process-file-item wpmf-uploading">\n<div class="wpmf-process-file-item-left"> ' + icon + '\n    <div class="wpmf-fileupload-name">\n        ' + name + '\n    </div>\n</div>\n<div class="wpmf-fileupload-progress-bar"></div>\n</li>';
        },

        /**
         * Set status folder color
         */
        appendCheckColor: function appendCheckColor() {
            $('.color-wrapper .color .color_check:not(.custom_color .color_check)').remove();
            $('.color-wrapper > .color[data-color="' + wpmf.vars.colors[wpmfFoldersModule.editFolderId] + '"]').append('<i class="material-icons color_check">done</i>');
        },
        /**
         * right click on folder to open menu
         */
        openContextMenuFolder: function openContextMenuFolder() {
            // init context menu on folders
            $('.wpmf-attachment, .wpmf-main-tree ul li .wpmf-item[data-id]').off('contextmenu').on('contextmenu', function (e) {
                if (parseInt($(e.target).data('id')) === 0 || $(e.target).closest('li').data('id') === 0) {
                    $('.wpmf-contextmenu-folder li').hide();
                    $('.material_newfolder').closest('li').show();
                    $('.wpmf-download-contextmenu, .wpmf-download-contextmenu li').show();
                } else {
                    $('.wpmf-contextmenu-folder li').show();
                }
                if (!$(this).hasClass('wpmf-new') && !$(this).hasClass('wpmf-back')) {
                    wpmfFoldersModule.houtside();
                    var x = e.clientX; // Get the horizontal coordinate
                    var y = e.clientY;
                    if ($(e.target).hasClass('wpmf-attachment')) {
                        wpmfFoldersModule.editFolderId = $(e.target).data('id');
                    } else {
                        wpmfFoldersModule.editFolderId = $(e.target).closest('li').data('id');
                    }

                    if (parseInt($(e.target).data('id')) !== parseInt(wpmfFoldersModule.last_selected_folder) && parseInt($(e.target).closest('li').data('id')) !== parseInt(wpmfFoldersModule.last_selected_folder)) {
                        $('.material_refreshfolder').closest('li').hide();
                    } else {
                        $('.material_refreshfolder').closest('li').show();
                    }

                    if (wpmf.vars.show_folder_id) {
                        $('.wpmf_folderID').html(wpmfFoldersModule.editFolderId);
                    }

                    if ($('.material_syncdrive').length) {
                        $('.material_syncdrive').closest('li').remove();
                    }

                    if (typeof wpmfFoldersModule.categories[wpmfFoldersModule.editFolderId].drive_type !== "undefined" && wpmfFoldersModule.categories[wpmfFoldersModule.editFolderId].drive_type !== '') {
                        $('.wpmf-download-contextmenu, .wpmf-download-contextmenu li').hide();
                    } else {
                        $('.wpmf-download-contextmenu, .wpmf-download-contextmenu li').show();
                    }

                    if (wpmfFoldersModule.categories[wpmfFoldersModule.editFolderId].drive_type !== '' && parseInt(wpmfFoldersModule.categories[wpmfFoldersModule.editFolderId].parent_id) === 0) {
                        $('.material_editfolder').closest('li').hide();
                    } else {
                        $('.material_editfolder').closest('li').show();
                    }

                    if (wpmfFoldersModule.categories[wpmfFoldersModule.editFolderId].drive_type === 'google_drive') {
                        $('.wpmf-contextmenu-folder').append('<li><div class="material_syncdrive material_sync_google_drive items_menu">' + wpmf.l18n.sync_drive + '<i class="material-icons wpmf_icon">sync</i></div></li>');
                    }

                    if (wpmfFoldersModule.categories[wpmfFoldersModule.editFolderId].drive_type === 'dropbox') {
                        $('.wpmf-contextmenu-folder').append('<li><div class="material_syncdrive material_sync_dropbox items_menu">' + wpmf.l18n.sync_drive + '<i class="material-icons wpmf_icon">sync</i></div></li>');
                    }

                    if (wpmfFoldersModule.categories[wpmfFoldersModule.editFolderId].drive_type === 'onedrive') {
                        $('.wpmf-contextmenu-folder').append('<li><div class="material_syncdrive material_sync_onedrive items_menu">' + wpmf.l18n.sync_drive + '<i class="material-icons wpmf_icon">sync</i></div></li>');
                    }

                    if (wpmfFoldersModule.categories[wpmfFoldersModule.editFolderId].drive_type === 'onedrive_business') {
                        $('.wpmf-contextmenu-folder').append('<li><div class="material_syncdrive material_sync_onedrive_business items_menu">' + wpmf.l18n.sync_drive + '<i class="material-icons wpmf_icon">sync</i></div></li>');
                    }

                    if (wpmfFoldersModule.categories[wpmfFoldersModule.editFolderId].drive_type === 'nextcloud') {
                        $('.wpmf-contextmenu-folder').append('<li><div class="material_syncdrive material_sync_nextcloud items_menu">' + wpmf.l18n.sync_drive + '<i class="material-icons wpmf_icon">sync</i></div></li>');
                    }
                    wpmfFoldersModule.doSyncDrive();
                    // render custom color
                    wpmfFoldersModule.renderCustomColor();
                    // change color for folder
                    wpmfFoldersModule.setFolderColor();
                    // Set status folder color
                    wpmfFoldersModule.appendCheckColor();
                    $('.wpmf-contextmenu').removeClass('context_overflow');
                    if ($('.wpmf-main-tree').length && $(this).hasClass('wpmf-item')) {
                        if (y + $('.wpmf-contextmenu-folder').outerHeight() > $('.wpmf-main-tree').offset().top + $('.wpmf-main-tree').height()) {
                            y = y - $('.wpmf-contextmenu-folder').outerHeight();
                        }
                    }
                    if (x + $('.wpmf-contextmenu-folder').width() + 236 > $(window).width()) {
                        $('.wpmf-contextmenu.wpmf-contextmenu-folder').addClass('context_overflow').slideDown(200).css({
                            'right': $(window).width() - x + 'px',
                            'left': 'auto',
                            'top': y + 'px'
                        });
                    } else {
                        $('.wpmf-contextmenu.wpmf-contextmenu-folder').slideDown(200).css({
                            'left': x + 'px',
                            'right': 'auto',
                            'top': y + 'px'
                        });
                    }
                }
                return false;
            });

            $('body').on('click', function (e) {
                if (!$(e.target).hasClass('colorsub') && !$(e.target).hasClass('wp-color-folder')) {
                    wpmfFoldersModule.houtside();
                }
            });

            // edit folder
            $('.material_editfolder').off('click').on('click', function (e) {
                wpmfFoldersModule.clickEditFolder(e, wpmfFoldersModule.editFolderId);
                wpmfFoldersModule.houtside();
            });

            $('.material_newfolder').off('click').on('click', function (e) {
                wpmfFoldersModule.newFolder(wpmfFoldersModule.editFolderId);
                wpmfFoldersModule.houtside();
            });

            $('.material_refreshfolder').off('click').on('click', function (e) {
                wpmfFoldersModule.reloadAttachments();
                wpmfFoldersModule.houtside();
            });

            // delete folder
            $('.material_deletefolder').off('click').on('click', function (e) {
                wpmfFoldersModule.clickDeleteFolder(e, wpmfFoldersModule.editFolderId);
                wpmfFoldersModule.houtside();
            });

            $('.wpmf-bulk-folders-btn').off('click').on('click', function (e) {
                e.preventDefault();
                if ($('.wpmf-folder-actions').hasClass('wpmf-deactivate')) {
                    $('.wpmf-tree-actions').find('.wpmf-new-folder').addClass('hide');
                } else {
                    $('.wpmf-tree-actions').find('.wpmf-new-folder').removeClass('hide');
                }
                $('.wpmf-folder-actions').toggleClass('wpmf-deactivate');
                $('.wpmf-tree-checkbox').toggleClass('hide');
            });

            // delete folder
            $('.material_downloadfolder').off('click').on('click', function (e) {
                var sub = $(this).data('sub');
                $.ajax({
                    type: "POST",
                    url: wpmf.vars.ajaxurl,
                    data: {
                        action: "wpmf",
                        task: "download_folder",
                        folder_id: wpmfFoldersModule.editFolderId,
                        download_sub: sub,
                        wpmf_nonce: wpmf.vars.wpmf_nonce
                    },
                    beforeSend: function beforeSend() {
                        // Show snackbar
                        if (!$('.wpmf-snackbar[data-id="download_folder"]').length) {
                            wpmfSnackbarModule.show({
                                id: 'download_folder',
                                content: wpmf.l18n.download_folder,
                                auto_close: false,
                                is_progress: true
                            });
                        }
                    },
                    success: function success(response) {
                        wpmfSnackbarModule.close('download_folder');
                        if (response.status) {
                            var hidden_a = document.createElement('a');
                            hidden_a.setAttribute('href', response.link);
                            hidden_a.setAttribute('download', response.zipname);
                            document.body.appendChild(hidden_a);
                            hidden_a.click();
                        }
                    }
                });
                wpmfFoldersModule.houtside();
            });

            // get URL attachment
            $('.material_copyFolderId').off('click').on('click', function (e) {
                wpmfFoldersModule.setClipboardText(wpmfFoldersModule.editFolderId, wpmf.l18n.copy_folderID_msg);
                wpmfFoldersModule.houtside();
            });

            // change color for folder
            wpmfFoldersModule.setFolderColor();
        },

        /**
         * render custom color
         */
        renderCustomColor: function renderCustomColor() {
            // remove old html
            $('.custom_color_wrap').remove();
            var value = '';
            var custom_color = '';
            var colorlists = wpmf.l18n.colorlists;
            var folder_color = '<div class="custom_color_wrap">';
            if (typeof colorlists[wpmf.vars.colors[wpmfFoldersModule.editFolderId]] === 'undefined') {
                if (typeof wpmf.vars.colors[wpmfFoldersModule.editFolderId] === 'undefined') {
                    custom_color = '#b2b2b2';
                } else {
                    custom_color = wpmf.vars.colors[wpmfFoldersModule.editFolderId];
                    value = wpmf.vars.colors[wpmfFoldersModule.editFolderId];
                }
            } else {
                custom_color = '#b2b2b2';
            }
            folder_color += '\n                        <input name="wpmf_color_folder" type="text"\n                         placeholder="' + wpmf.l18n.placegolder_color + '"\n                                       value="' + value + '"\n                                       class="inputbox input-block-level wp-color-folder wp-color-picker">';
            folder_color += '<div data-color="' + custom_color + '" class="color custom_color" style="background: ' + custom_color + '"><i class="material-icons color_uncheck">check</i></div>';
            folder_color += '</div>';
            $('.color-wrapper').append(folder_color);
        },

        /**
         * Set folder color
         */
        setFolderColor: function setFolderColor() {
            $('.wp-color-folder').on('keyup', function (e) {
                var val = $(this).val();
                if (val.length >= 4) {
                    $('.color.custom_color').data('color', val).css('background', val);
                } else {
                    $('.color.custom_color').data('color', 'transparent').css('background', 'transparent');
                }
            });

            // change color for folder
            $('.wpmf-contextmenu.wpmf-contextmenu-folder .color').off('click').on('click', function (e) {
                var color = $(this).data('color');
                $('.wpmf-attachment.wpmf-folder[data-id="' + wpmfFoldersModule.editFolderId + '"] .mdc-list-item__start-detail').css('color', color);
                $('.wpmf-main-tree .wpmf-item[data-id="' + wpmfFoldersModule.editFolderId + '"] .wpmf-item-icon, .wpmf-main-tree .wpmf-item[data-id="' + wpmfFoldersModule.editFolderId + '"] .tree_drive_icon').css('color', color);
                $('.wpmf-attachment.wpmf-folder[data-id="' + wpmfFoldersModule.editFolderId + '"] .mdc-list-item__start-detail svg .cls-2').css('fill', color);
                $('.wpmf-main-tree .wpmf-item[data-id="' + wpmfFoldersModule.editFolderId + '"] .tree_drive_icon_img > .cls-2').css('fill', color);
                wpmf.vars.colors[wpmfFoldersModule.editFolderId] = color;
                wpmfFoldersModule.appendCheckColor();
                $.ajax({
                    type: "POST",
                    url: wpmf.vars.ajaxurl,
                    data: {
                        action: "wpmf",
                        task: "set_folder_color",
                        color: color,
                        folder_id: wpmfFoldersModule.editFolderId,
                        wpmf_nonce: wpmf.vars.wpmf_nonce
                    },
                    success: function success(response) {
                        if (!response.status) {
                            // Show dialog when set background folder failed
                            showDialog({
                                title: wpmf.l18n.information, // todo : use the response message instead of a predefined one
                                text: wpmf.l18n.bgcolorerror,
                                closeicon: true
                            });
                        }
                    }
                });
            });
        },

        doSyncDrive: function doSyncDrive() {
            $('.material_sync_google_drive').on('click', function () {
                wpmfAddCloudQueue.addGoogleQueue(wpmfFoldersModule.editFolderId);
            });

            $('.material_sync_dropbox').on('click', function () {
                wpmfAddCloudQueue.addDropboxQueue();
            });

            $('.material_sync_onedrive').on('click', function () {
                wpmfAddCloudQueue.addOnedriveQueue();
            });

            $('.material_sync_onedrive_business').on('click', function () {
                wpmfAddCloudQueue.addOnedriveBusinessQueue();
            });

            $('.material_sync_nextcloud').on('click', function () {
                wpmfAddCloudQueue.addNextcloudQueue();
            });
        },

        /**
         * render form replace
         */
        renderFormReplace: function renderFormReplace() {
            $('.replace_wrap').remove();
            var form_replace = '\n                    <div class="replace_wrap" style="display: none">\n                    <form id="wpmf_form_upload" method="post" action="' + wpmf.vars.ajaxurl + '" enctype="multipart/form-data">\n                    <input class="hide" type="file" name="wpmf_replace_file" id="wpmf_upload_input_version">\n                    <input type="hidden" name="action" value="wpmf_replace_file">\n                    <input type="hidden" name="wpmf_nonce" value="' + wpmf.vars.wpmf_nonce + '">\n                    <input type="hidden" name="post_selected" value="' + wpmfFoldersModule.editFileId + '">\n                    </form>\n                ';
            if (!$('.replace_wrap').length) {
                $('body').append(form_replace);
            }
        },

        /**
         * right click on file to open menu
         */
        openContextMenuFile: function openContextMenuFile() {
            // init context menu on files
            $('.attachments-browser .attachment:not(.wpmf-attachment)').off('contextmenu').on('contextmenu', function (e) {
                wpmfFoldersModule.houtside();
                var x = e.clientX; // Get the horizontal coordinate
                var y = e.clientY;
                if ($(e.target).hasClass('thumbnail')) {
                    wpmfFoldersModule.editFileId = $(e.target).closest('li').data('id');
                } else {
                    wpmfFoldersModule.editFileId = $(e.target).data('id');
                }

                $('.material_downloadfile').data('id', wpmfFoldersModule.editFileId);
                if (typeof wpmfFoldersModule.categories[wpmfFoldersModule.last_selected_folder].drive_type !== "undefined" && wpmfFoldersModule.categories[wpmfFoldersModule.last_selected_folder].drive_type !== '') {
                    $('.set_folder_menu').closest('li').hide();
                    $('.material_import').closest('li').show();
                } else {
                    $('.set_folder_menu').closest('li').show();
                    $('.material_import').closest('li').hide();
                }

                if (wp.media.attachment(wpmfFoldersModule.editFileId).get('mime') !== 'application/pdf') {
                    $('.insert_pdfembed').closest('li').addClass('hide').removeClass('show');
                } else {
                    $('.insert_pdfembed').closest('li').addClass('show').removeClass('hide');
                }

                if (wp.media.attachment(wpmfFoldersModule.editFileId).get('mime') === 'image/jpg' || wp.media.attachment(wpmfFoldersModule.editFileId).get('mime') === 'image/jpeg' || wp.media.attachment(wpmfFoldersModule.editFileId).get('mime') === 'image/png') {
                    $('.insert_image_lightbox').closest('li').addClass('show').removeClass('hide');
                } else {
                    $('.insert_image_lightbox').closest('li').addClass('hide').removeClass('show');
                }
                var context_height = $('.wpmf-contextmenu.wpmf-contextmenu-file').height();
                if (y + context_height > $(window).height()) {
                    y = y - context_height;
                }

                $('.wpmf-contextmenu').removeClass('context_overflow');
                if (x + $('.wpmf-contextmenu-file').width() > $(window).width()) {
                    $('.wpmf-contextmenu.wpmf-contextmenu-file').addClass('context_overflow').slideDown(200).css({
                        'right': $(window).width() - x + 'px',
                        'left': 'auto',
                        'top': y + 'px'
                    });
                } else {
                    $('.wpmf-contextmenu.wpmf-contextmenu-file').slideDown(200).css({
                        'left': x + 'px',
                        'right': 'auto',
                        'top': y + 'px'
                    });
                }

                // create form replace
                wpmfFoldersModule.renderFormReplace();
                return false;
            });

            // edit folder
            $('.material_editfile').off('click').on('click', function (e) {
                $('.attachments-browser .attachments .attachment[data-id="' + wpmfFoldersModule.editFileId + '"]').click();
                wpmfFoldersModule.houtside();
            });

            // delete folder
            $('.material_deletefile').off('click').on('click', function (e) {
                wpmfFoldersModule.clickDeleteFile(e, wpmfFoldersModule.editFileId);
                wpmfFoldersModule.houtside();
            });

            // duplicate file
            $('.material_duplicatefile').off('click').on('click', function (e) {
                wpmfDuplicateModule.doDuplicate(wpmfFoldersModule.editFileId);
                wpmfFoldersModule.houtside();
            });

            // get URL attachment
            $('.material_geturlfile').off('click').on('click', function (e) {
                var url = wp.media.attachment(wpmfFoldersModule.editFileId).get('url');
                wpmfFoldersModule.setClipboardText(url, wpmf.l18n.copy_url);
                wpmfFoldersModule.houtside();
            });

            $('.material_downloadfile').off('click').on('click', function (e) {
                e.preventDefault();
                var id = $(this).data('id');
                $.ajax({
                    type: "POST",
                    url: wpmf.vars.ajaxurl,
                    data: {
                        action: "wpmf",
                        task: "wpmf_download_file",
                        id: id,
                        wpmf_nonce: wpmf.vars.wpmf_nonce
                    },
                    success: function success(response) {
                        if (response.status) {
                            window.location.href = wpmf.vars.site_url + '?act=wpmf_download_file&id=' + id + '&wpmf_nonce=' + wpmf.vars.wpmf_nonce;
                        } else {
                            showDialog({
                                text: wpmf.l18n.cannot_download,
                                closeicon: true
                            });
                        }
                    }
                });
            });

            $('.material_overridefile').off('click').on('click', function (e) {
                $('#wpmf_upload_input_version').click();
                wpmfReplaceModule.doEvent();
                wpmfReplaceModule.replace_attachment(wpmfFoldersModule.editFileId, 'material');
                wpmfFoldersModule.houtside();
            });

            $('.insert_pdfembed').off('click').on('click', function (e) {
                var mime = wp.media.attachment(wpmfFoldersModule.editFileId).get('mime');
                if (mime === 'application/pdf') {
                    var url = wp.media.attachment(wpmfFoldersModule.editFileId).get('url');
                    var title = wp.media.attachment(wpmfFoldersModule.editFileId).get('title');
                    var filename = wp.media.attachment(wpmfFoldersModule.editFileId).get('filename');
                    var html = '<a class="wpmf-pdfemb-viewer" href="' + url + '">';
                    if (title !== '') {
                        html += title;
                    } else {
                        html += filename;
                    }
                    html += '</a>';
                    window.send_to_editor(html);
                    wp.media.frame.close();
                    wpmfFoldersModule.houtside();
                }
            });

            $('.insert_image_lightbox').off('click').on('click', function (e) {
                var lightbox_size = wpmfFoldersModule.getFrame().find('.compat-field-wpmf_image_lightbox select').val();
                var image_size = wpmfFoldersModule.getFrame().find('#attachment-display-settings-size').val();
                if (typeof lightbox_size === "undefined") {
                    lightbox_size = 'full';
                }
                if (typeof image_size === "undefined") {
                    image_size = 'medium';
                }
                var sizes = wp.media.attachment(wpmfFoldersModule.editFileId).get('sizes');
                var html = '<a href="' + sizes[lightbox_size].url + '">';
                html += '<img src="' + sizes[image_size].url + '" class="wpmf_image_lightbox" />';
                html += '</a>';
                //wp.media.editor.insert(html);
                window.send_to_editor(html);
                wp.media.frame.close();
                wpmfFoldersModule.houtside();
            });

            // change folder for file
            $('.set_folder_menu').off('click').on('click', function (e) {
                var type = wpmfFoldersModule.getFrame().find('.attachments-browser .attachment.selected').length > 1 ? 'multiple' : 'one';
                wpmfAssignModule.showdialog(type);
                wpmfAssignModule.initTree();
                wpmfFoldersModule.houtside();
            });

            $('.material_import').off('click').on('click', function (e) {
                wpmfImportCloudModule.showdialog(false);
                wpmfImportCloudModule.initModule();
                wpmfFoldersModule.houtside();
            });

            $('.material_copy_file_to_s3').off('click').on('click', function (e) {
                wpmfFoldersModule.uploadFilesToS3(wpmfFoldersModule.editFileId);
                wpmfFoldersModule.houtside();
            });
        },

        /**
         * Upload the files to S3
         *
         * @param ids
         */
        uploadFilesToS3: function uploadFilesToS3(ids) {
            $.ajax({
                type: "POST",
                url: wpmf.vars.ajaxurl,
                data: {
                    action: "wpmf_upload_single_file_to_s3",
                    ids: ids,
                    wpmf_nonce: wpmf.vars.wpmf_nonce
                },
                beforeSend: function beforeSend() {
                    wpmfSnackbarModule.show({
                        id: 'uploadFilesToS3',
                        content: wpmf.l18n.uploading_files_to_s3,
                        icon: '<span class="material-icons-outlined wpmf-snack-icon wpmf-snack-loader">sync</span>',
                        auto_close: false,
                        is_progress: true
                    });
                },
                success: function success(response) {
                    wpmfSnackbarModule.close('uploadFilesToS3');
                    if (response.status) {
                        if (typeof response.remove !== "undefined" && parseInt(response.remove) === 1) {
                            wpmfFoldersModule.removeLocalFiles(response.ids);
                        } else {
                            wpmfFoldersModule.reloadAttachments();
                        }
                    }
                }
            });
        },

        /**
         * Remove the files from local
         *
         * @param ids
         */
        removeLocalFiles: function removeLocalFiles(ids) {
            $.ajax({
                type: "POST",
                url: wpmf.vars.ajaxurl,
                data: {
                    action: "wpmf_remove_local_file",
                    ids: ids,
                    wpmf_nonce: wpmf.vars.wpmf_nonce
                },
                beforeSend: function beforeSend() {
                    wpmfSnackbarModule.show({
                        id: 'removeFilesFromLocal',
                        content: wpmf.l18n.removing_files_from_local,
                        auto_close: false,
                        is_progress: true
                    });
                },
                success: function success(res) {
                    if (res.status) {
                        wpmfSnackbarModule.close('removeFilesFromLocal');
                        wpmfFoldersModule.reloadAttachments();
                    }
                }
            });
        },

        /**
         * click outside
         */
        houtside: function houtside() {
            $('.wpmf-contextmenu-file, .wpmf-contextmenu-folder').hide();
        },

        /**
         * set clipboard text
         * @param text
         */
        setClipboardText: function setClipboardText(text, msg_success) {
            var id = "mycustom-clipboard-textarea-hidden-id";
            var existsTextarea = document.getElementById(id);

            if (!existsTextarea) {
                var textarea = document.createElement("textarea");
                textarea.id = id;
                // Place in top-left corner of screen regardless of scroll position.
                textarea.style.position = 'fixed';
                textarea.style.top = 0;
                textarea.style.left = 0;

                // Ensure it has a small width and height. Setting to 1px / 1em
                // doesn't work as this gives a negative w/h on some browsers.
                textarea.style.width = '1px';
                textarea.style.height = '1px';

                // We don't need padding, reducing the size if it does flash render.
                textarea.style.padding = 0;

                // Clean up any borders.
                textarea.style.border = 'none';
                textarea.style.outline = 'none';
                textarea.style.boxShadow = 'none';

                // Avoid flash of white box if rendered for any reason.
                textarea.style.background = 'transparent';
                document.querySelector("body").appendChild(textarea);
                existsTextarea = document.getElementById(id);
            }

            existsTextarea.value = text;
            existsTextarea.select();

            try {
                var status = document.execCommand('copy');
                if (!status) {
                    showDialog({
                        title: wpmf.l18n.information, // todo : use the response message instead of a predefined one
                        text: wpmf.l18n.cannot_copy,
                        closeicon: true
                    });
                } else {
                    wpmfSnackbarModule.show({
                        id: 'copy_success',
                        content: msg_success,
                        auto_close_delay: 1000
                    });
                }
            } catch (err) {
                showDialog({
                    title: wpmf.l18n.information, // todo : use the response message instead of a predefined one
                    text: wpmf.l18n.unable_copy,
                    closeicon: true
                });
            }
        },

        renderPermissionHtml: function renderPermissionHtml(role_user_list) {
            var cl = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'folder_permission_items';

            return '<div class="folder_permission_items_wrap"><div class="' + cl + '" data-role="{{wpmf_role}}">\n                    ' + role_user_list + '\n                    <div class="ju-settings-option folder_permission_item">\n                        <div class="wpmf_row_full">\n                            <label class="ju-setting-label text">' + wpmf.l18n.view_folder + '</label>\n                            <div class="ju-switch-button">\n                                <label class="switch">\n                                    <input type="checkbox" checked class="permission_item_checkbox" value="view_folder">\n                                    <span class="slider round"></span>\n                                </label>\n                            </div>\n                        </div>\n                    </div>\n                    \n                    <div class="ju-settings-option folder_permission_item">\n                        <div class="wpmf_row_full">\n                            <label class="ju-setting-label text">' + wpmf.l18n.add_folder + '</label>\n                            <div class="ju-switch-button">\n                                <label class="switch">\n                                    <input type="checkbox" checked class="permission_item_checkbox" value="add_folder">\n                                    <span class="slider round"></span>\n                                </label>\n                            </div>\n                        </div>\n                    </div>\n                    \n                    <div class="ju-settings-option folder_permission_item">\n                        <div class="wpmf_row_full">\n                            <label class="ju-setting-label text">' + wpmf.l18n.update_folder + '</label>\n                            <div class="ju-switch-button">\n                                <label class="switch">\n                                    <input type="checkbox" checked class="permission_item_checkbox" value="update_folder">\n                                    <span class="slider round"></span>\n                                </label>\n                            </div>\n                        </div>\n                    </div>\n                    \n                    <div class="ju-settings-option folder_permission_item">\n                        <div class="wpmf_row_full">\n                            <label class="ju-setting-label text">' + wpmf.l18n.remove_folder + '</label>\n                            <div class="ju-switch-button">\n                                <label class="switch">\n                                    <input type="checkbox" checked class="permission_item_checkbox" value="remove_folder">\n                                    <span class="slider round"></span>\n                                </label>\n                            </div>\n                        </div>\n                    </div>\n                           \n                    <div class="ju-settings-option folder_permission_item">\n                        <div class="wpmf_row_full">\n                            <label class="ju-setting-label text">' + wpmf.l18n.view_media + '</label>\n                            <div class="ju-switch-button">\n                                <label class="switch">\n                                    <input type="checkbox" checked class="permission_item_checkbox" value="view_media">\n                                    <span class="slider round"></span>\n                                </label>\n                            </div>\n                        </div>\n                    </div>\n                                        \n                    <div class="ju-settings-option folder_permission_item">\n                        <div class="wpmf_row_full">\n                            <label class="ju-setting-label text">' + wpmf.l18n.add_media + '</label>\n                            <div class="ju-switch-button">\n                                <label class="switch">\n                                    <input type="checkbox" checked class="permission_item_checkbox" value="add_media">\n                                    <span class="slider round"></span>\n                                </label>\n                            </div>\n                        </div>\n                    </div>\n                    \n                    <div class="ju-settings-option folder_permission_item">\n                        <div class="wpmf_row_full">\n                            <label class="ju-setting-label text">' + wpmf.l18n.move_media + '</label>\n                            <div class="ju-switch-button">\n                                <label class="switch">\n                                    <input type="checkbox" checked class="permission_item_checkbox" value="move_media">\n                                    <span class="slider round"></span>\n                                </label>\n                            </div>\n                        </div>\n                    </div>\n                    \n                    <div class="ju-settings-option folder_permission_item">\n                        <div class="wpmf_row_full">\n                            <label class="ju-setting-label text">' + wpmf.l18n.remove_media + '</label>\n                            <div class="ju-switch-button">\n                                <label class="switch">\n                                    <input type="checkbox" checked class="permission_item_checkbox" value="remove_media">\n                                    <span class="slider round"></span>\n                                </label>\n                            </div>\n                        </div>\n                    </div>\n                    <div class="ju-settings-option folder_permission_item">\n                        <div class="wpmf_row_full">\n                            <label class="ju-setting-label text">' + wpmf.l18n.update_media + '</label>\n                            <div class="ju-switch-button">\n                                <label class="switch">\n                                    <input type="checkbox" checked class="permission_item_checkbox" value="update_media">\n                                    <span class="slider round"></span>\n                                </label>\n                            </div>\n                        </div>\n                    </div>\n                </div></div>';
        },

        renderFolderPermissionsWrap: function renderFolderPermissionsWrap() {
            if (wpmf.vars.wpmf_role !== 'administrator') {
                return false;
            }

            var roles = '',
                users = '';
            $.each(wpmf.vars.roles, function (role, role_infos) {
                roles += '<option value="' + role + '">' + role_infos.name + '</option>';
            });

            $.each(wpmf.vars.users, function (user, user_infos) {
                users += '<option value="' + user_infos.ID + '">' + user_infos.display_name + '</option>';
            });

            var role_list = '<div class="width_100">\n                        <div class="ju-settings-option folder_permission_item">\n                            <div class="wpmf_row_full">\n                                <label class="ju-setting-label text">' + wpmf.l18n.role + '</label>\n                                <div class="roles_wrap">\n                                    <select class="wpmf_role_permissions">\n                                    <option value="0">' + wpmf.l18n.select_role + '</option>\n                                    ' + roles + '\n                                    </select>\n                                </div>\n                            </div>\n                            \n                            <span class="material-icons-outlined delete_role_permissions"> delete </span>\n                        </div>        \n                    </div>';

            var user_list = '<div class="width_100">\n                        <div class="ju-settings-option folder_permission_item">\n                            <div class="wpmf_row_full">\n                                <label class="ju-setting-label text">' + wpmf.l18n.user + '</label>\n                                <div class="roles_wrap">\n                                    <select class="wpmf_user_permissions">\n                                    <option value="0">' + wpmf.l18n.select_user + '</option>\n                                    ' + users + '\n                                    </select>\n                                </div>\n                            </div>\n                            \n                            <span class="material-icons-outlined delete_role_permissions"> delete </span>\n                        </div>        \n                    </div>';

            var role_permission_html = wpmfFoldersModule.renderPermissionHtml(role_list, 'folder_permission_items folder_role_permission_items');
            var user_permission_html = wpmfFoldersModule.renderPermissionHtml(user_list, 'folder_permission_items folder_user_permission_items');
            var html = '\n            <div id="folder_permissions" class="wpmf_view folder_permissions_wrap white-popup mfp-hide">\n                <div class="folder_permissions_box wpmf_scrollbar_style">\n                    <div class="wpmf_tabs_wrap">\n                        <ul class="wpmf_tabs">\n                            <li class="wpmf_tab active" data-tab="role">' + wpmf.l18n.by_role + '</li>\n                            <li class="wpmf_tab" data-tab="user">' + wpmf.l18n.by_user + '</li>\n                        </ul>\n                    </div>\n                    <p class="permission_folder_head">' + wpmf.l18n.permissions_list_of + ' <b class="permission_folder_name"></b> ' + wpmf.l18n.folder + ':</p>\n                    <div class="wpmf_contents_wrap">\n                         <div class="wpmf_permission_content" data-tab="role" style="display: block">\n                        <div class="roles_list_html">\n                    ' + role_permission_html + '\n                    </div>\n                    <p class="folder_permission_items_wrap folder_permission_btn_wrap"><button class="wpmf_add_role ju-button">\n                            ' + wpmf.l18n.add_role + '\n                            <span class="material-icons-outlined">add_circle_outline</span>\n                        </button></p>\n                        </div>\n                        \n                        <div class="wpmf_permission_content" data-tab="user">\n                           <div class="users_list_html">\n                    ' + user_permission_html + '\n                    </div>\n                    <p class="folder_permission_items_wrap folder_permission_btn_wrap"><button class="wpmf_add_user ju-button">\n                            ' + wpmf.l18n.add_user + '\n                            <span class="material-icons-outlined">add_circle_outline</span>\n                        </button></p>\n                        </div>\n                    </div>\n                    \n                    <p style="text-align: center">\n                        <button class="wpmf_save_btn wpmf_save_permission ju-button">\n                            ' + wpmf.l18n.save + '\n                        </button>\n                        \n                         <button class="wpmf_save_btn wpmf_save_close_btn wpmf_save_permission ju-button blue-button">\n                            ' + wpmf.l18n.save_close + '\n                        </button>\n                    </p>\n                </div>\n            </div>';
            $('body').append(html);

            $('#folder_permissions .wpmf_tab').unbind('click').bind('click', function () {
                var tab = $(this).data('tab');
                $('#folder_permissions .wpmf_tab').removeClass('active');
                $(this).addClass('active');
                $('.wpmf_permission_content').hide();
                $('.wpmf_permission_content[data-tab="' + tab + '"]').show();
            });

            // show popup inline
            if ($().magnificPopup) {
                $('.open_folder_permissions').magnificPopup({
                    type: 'inline',
                    mainClass: 'wpmf_folder_permissions_popup',
                    closeBtnInside: true,
                    midClick: true,
                    closeOnBgClick: true,
                    callbacks: {
                        beforeOpen: function beforeOpen() {
                            this.wrap.removeAttr('tabindex');
                        },
                        open: function open() {
                            wpmfFoldersModule.houtside();
                            $.ajax({
                                type: "POST",
                                url: wpmf.vars.ajaxurl,
                                data: {
                                    action: "wpmf",
                                    task: "get_folder_permissions",
                                    folder_id: wpmfFoldersModule.editFolderId,
                                    wpmf_nonce: wpmf.vars.wpmf_nonce
                                },
                                beforeSend: function beforeSend() {
                                    $('.folder_permissions_wrap').addClass('wpmf_saving');
                                    $('.roles_list_html').html('');
                                    $('.users_list_html').html('');
                                },
                                success: function success(response) {
                                    $('.folder_permissions_wrap').removeClass('wpmf_saving');
                                    if (response.status) {
                                        $('.permission_folder_name').html(wpmfFoldersModule.categories[wpmfFoldersModule.editFolderId].label);
                                        if (response.role_permissions.length) {
                                            $.each(response.role_permissions, function (i, permission) {
                                                var selected = permission[0];
                                                if (selected == null) {
                                                    selected = 0;
                                                }
                                                var html = role_permission_html.replace('{{wpmf_role}}', selected);
                                                $('.roles_list_html').append(html);
                                                $('.folder_role_permission_items[data-role="' + selected + '"]').find('.wpmf_role_permissions').val(selected).change();
                                                $('.folder_role_permission_items[data-role="' + selected + '"]').find('.permission_item_checkbox').prop('checked', false);
                                                $.each(permission, function (j, permission2) {
                                                    $('.folder_role_permission_items[data-role="' + selected + '"]').find('.permission_item_checkbox[value="' + permission2 + '"]').prop('checked', true);
                                                });
                                            });
                                        } else {
                                            $('.roles_list_html').append(role_permission_html);
                                        }

                                        if (response.user_permissions.length) {
                                            $.each(response.user_permissions, function (i, permission) {
                                                var selected = permission[0];
                                                if (selected == null) {
                                                    selected = 0;
                                                }

                                                var html = user_permission_html.replace('{{wpmf_role}}', selected);
                                                $('.users_list_html').append(html);
                                                $('.folder_user_permission_items[data-role="' + selected + '"]').find('.wpmf_user_permissions').val(selected).change();
                                                $('.folder_user_permission_items[data-role="' + selected + '"]').find('.permission_item_checkbox').prop('checked', false);
                                                $.each(permission, function (j, permission2) {
                                                    $('.folder_user_permission_items[data-role="' + selected + '"]').find('.permission_item_checkbox[value="' + permission2 + '"]').prop('checked', true);
                                                });
                                            });
                                        } else {
                                            $('.users_list_html').append(user_permission_html);
                                        }

                                        if (!$('.inherit_folder_wrap').length) {
                                            $('.wpmf_contents_wrap').prepend('<div class="folder_permission_items_wrap inherit_folder_wrap"><div class="folder_permission_items">\n<div class="ju-settings-option folder_permission_item folder_permission_inherit_folder_item">\n                        <div class="wpmf_row_full">\n                            <label class="ju-setting-label text">' + wpmf.l18n.inherit_folder + '</label>\n                            <div class="ju-switch-button">\n                                <label class="switch">\n                                    <input type="checkbox" class="permission_item_checkbox" value="inherit_folder">\n                                    <span class="slider round"></span>\n                                </label>\n                            </div>\n                        </div>\n                    </div></div></div>');
                                        }

                                        if (parseInt(response.inherit_folder) === 1) {
                                            $('.permission_item_checkbox[value="inherit_folder"]').prop('checked', true);
                                            $('.folder_permission_items_wrap:not(.inherit_folder_wrap)').hide();
                                        } else {
                                            $('.permission_item_checkbox[value="inherit_folder"]').prop('checked', false);
                                            $('.folder_permission_items_wrap').show();
                                        }

                                        $('.permission_item_checkbox[value="inherit_folder"]').on('change', function () {
                                            if ($(this).is(':checked')) {
                                                $('.folder_permission_items_wrap:not(.inherit_folder_wrap)').hide();
                                            } else {
                                                $('.folder_permission_items_wrap').show();
                                            }
                                        });

                                        $('.permission_item_checkbox[value="inherit_folder"]').on('change', function () {
                                            if ($(this).is(':checked')) {
                                                $('.folder_permission_items_wrap:not(.inherit_folder_wrap)').hide();
                                            } else {
                                                $('.folder_permission_items_wrap').show();
                                            }
                                        });

                                        $('.wpmf_role_permissions').on('change', function () {
                                            if ($(this).val() != 0) {
                                                $('.wpmf_add_role').addClass('show');
                                            } else {
                                                $('.wpmf_add_role').removeClass('show');
                                            }
                                        });

                                        $('.wpmf_user_permissions').on('change', function () {
                                            if ($(this).val() != 0) {
                                                $('.wpmf_add_user').addClass('show');
                                            } else {
                                                $('.wpmf_add_user').removeClass('show');
                                            }
                                        });

                                        if ($('.wpmf_role_permissions :selected').val() != 0) {
                                            $('.wpmf_add_role').addClass('show');
                                        } else {
                                            $('.wpmf_add_role').removeClass('show');
                                        }

                                        if ($('.wpmf_user_permissions  :selected').val() != 0) {
                                            $('.wpmf_add_user').addClass('show');
                                        } else {
                                            $('.wpmf_add_user').removeClass('show');
                                        }

                                        if ($().wpmfSelect2) {
                                            $('.wpmf_user_permissions, .wpmf_role_permissions').wpmfSelect2();
                                        }

                                        wpmfFoldersModule.removeRolePermissions();
                                    }
                                }
                            });
                        },
                        close: function close() {
                            $('.roles_list_html').html('');
                            $('.users_list_html').html('');
                        }
                        // e.t.c.
                    }
                });

                $('.wpmf_add_role').on('click', function () {
                    if ($('.wpmf_role_permissions').length > 0 && $('.wpmf_role_permissions:last :selected').val() == 0) {
                        return;
                    }
                    $('.roles_list_html').append(role_permission_html);
                    if ($().wpmfSelect2) {
                        $('.wpmf_role_permissions:last').wpmfSelect2();
                    }
                    wpmfFoldersModule.removeRolePermissions();
                });

                $('.wpmf_add_user').on('click', function () {
                    if ($('.wpmf_user_permissions').length > 0 && $('.wpmf_user_permissions:last :selected').val() == 0) {
                        return;
                    }
                    $('.users_list_html').append(user_permission_html);
                    if ($().wpmfSelect2) {
                        $('.wpmf_user_permissions:last').wpmfSelect2();
                    }
                    wpmfFoldersModule.removeRolePermissions();
                });

                $('.wpmf_cancel_btn').on('click', function () {
                    $.magnificPopup.close();
                });

                wpmfFoldersModule.removeRolePermissions();

                $('.wpmf_save_permission').on('click', function () {
                    var button = $(this);
                    var all_role_permissions = [],
                        all_user_permissions = [];
                    $('.folder_role_permission_items').each(function (i, item) {
                        var role = $(item).find('.wpmf_role_permissions :selected').val();
                        var permissions = [];
                        permissions.push(role);
                        $(item).find('.permission_item_checkbox').each(function (i, permission) {
                            if ($(permission).is(':checked')) {
                                permissions.push($(permission).val());
                            }
                        });
                        all_role_permissions.push(permissions);
                    });

                    $('.folder_user_permission_items').each(function (i, item) {
                        var user = $(item).find('.wpmf_user_permissions  :selected').val();
                        var permissions = [];
                        permissions.push(user);
                        $(item).find('.permission_item_checkbox').each(function (i, permission) {
                            if ($(permission).is(':checked')) {
                                permissions.push($(permission).val());
                            }
                        });
                        all_user_permissions.push(permissions);
                    });

                    $.ajax({
                        type: "POST",
                        url: wpmf.vars.ajaxurl,
                        data: {
                            action: "wpmf",
                            task: "save_folder_permissions",
                            folder_id: wpmfFoldersModule.editFolderId,
                            inherit_folder: $('.permission_item_checkbox[value="inherit_folder"]').is(':checked') ? 1 : 0,
                            role_permissions: JSON.stringify(all_role_permissions),
                            user_permissions: JSON.stringify(all_user_permissions),
                            wpmf_nonce: wpmf.vars.wpmf_nonce
                        },
                        beforeSend: function beforeSend() {
                            $('.folder_permissions_wrap').addClass('wpmf_saving');
                        },
                        success: function success(response) {
                            $('.folder_permissions_wrap').removeClass('wpmf_saving');
                            if (response.status) {
                                if (button.hasClass('wpmf_save_close_btn')) {
                                    $.magnificPopup.close();
                                }
                            }
                        }
                    });
                });
            }
        },

        removeRolePermissions: function removeRolePermissions() {
            $('.delete_role_permissions').unbind('click').bind('click', function () {
                $(this).closest('.folder_permission_items_wrap').remove();
            });
        },

        /**
         * render context menu box
         */
        renderContextMenu: function renderContextMenu() {
            var colors = '';
            // render list color
            $.each(wpmf.l18n.colorlists, function (i, title) {
                colors += '<div data-color="' + i + '" title="' + title + '" class="color" \n                 style="background: ' + i + '"></div>';
            });

            // render context menu for folder
            var context_folder = '\n            <ul class="wpmf-contextmenu wpmf-contextmenu-folder contextmenu z-depth-1 grey-text text-darken-2">\n                <li><div class="material_newfolder items_menu">' + wpmf.l18n.new_folder + '<span class="material-icons-outlined wpmf_icon"> create_new_folder </span></div></li>\n                <li><div class="material_refreshfolder items_menu">' + wpmf.l18n.refresh + '<span class="material-icons-outlined wpmf_icon"> refresh </span></div></li>\n                <li><div class="material_editfolder items_menu">' + wpmf.l18n.edit_folder + '<span class="material-icons-outlined wpmf_icon"> edit </span></div></li>\n                <li><div class="material_deletefolder items_menu">' + wpmf.l18n.delete + '<span class="material-icons-outlined wpmf_icon"> delete_outline </span></div></li>\n                <li><div class="wpmf-bulk-folders-btn items_menu">' + wpmf.l18n.bulk_select + '<span class="material-icons-outlined wpmf_icon"> checklist </span></div></li>\n            ';

            context_folder += '<li class="sub wpmf-download-contextmenu">\n                <div class="items_menu">\n                    <span class="material-icons-outlined wpmf_icon"> download </span>\n                    ' + wpmf.l18n.download + '            \n                    <div class="waves waves-effect"></div>\n                <i class="material-icons right">keyboard_arrow_right</i>\n                </div>\n                <ul class="submenu z-depth-1">\n                    <li><div class="material_downloadfolder items_menu" data-sub="0">' + wpmf.l18n.download_zip + '<span class="material-icons-outlined wpmf_icon"> download </span></div></li>\n                    <li><div class="material_downloadfolder items_menu" data-sub="1">' + wpmf.l18n.download_sub + '<span class="material-icons-outlined wpmf_icon"> download </span></div></li>\n                </ul>\n            </li>';

            context_folder += '<li class="sub folder-color">\n                <div class="items_menu">\n                    <span class="material-icons-outlined wpmf_icon"> format_paint </span>\n                    ' + wpmf.l18n.change_color + '            \n                    <div class="waves waves-effect"></div>\n                <span class="wpmf_changecolor_icon wpmf_icon"></span>\n                <i class="material-icons right">keyboard_arrow_right</i>\n                </div>\n                <ul class="colorsub submenu z-depth-1">\n                    <li class="waves-effect wpmf-color-picker">\n                            <div class="color-wrapper">\n                            ' + colors + '\n                            </div>\n                    </li>\n                </ul>\n            </li>';

            if (wpmf.vars.show_folder_id) {
                context_folder += '<li><div class="material_copyFolderId items_menu">' + wpmf.l18n.copy_folder_id + '<span class="wpmf_folderID"></span><span class="material-icons-outlined wpmf_icon"> content_copy </span></div></li>';
            }

            if (wpmf.vars.enable_permissions_settings) {
                context_folder += '<li><a class="open_folder_permissions items_menu" href="#folder_permissions">' + wpmf.l18n.permissions_setting + '<span class="material-icons-outlined wpmf_icon"> settings </span></a></li>';
            }

            context_folder += '</ul>';

            // render context menu for file
            // duplicate menu
            var duplicate = '';
            if (typeof wpmf.vars.duplicate !== 'undefined' && parseInt(wpmf.vars.duplicate) === 1) {
                duplicate = '<li><div class="material_duplicatefile items_menu">' + wpmf.l18n.duplicate_text + '<span class="material-icons-outlined wpmf_icon"> file_copy </span></div></li>';
            }

            // replace menu
            var override = '';
            if (typeof wpmf.vars.override !== 'undefined' && parseInt(wpmf.vars.override) === 1) {
                override = '<li><div class="material_overridefile items_menu">' + wpmf.l18n.replace + '<span class="material-icons-outlined wpmf_icon"> sync </span></div></li>';
            }

            var context_file = '<ul class="wpmf-contextmenu wpmf-contextmenu-file contextmenu z-depth-1 grey-text text-darken-2">';
            if (wpmf.vars.wpmf_pagenow === 'upload.php') {
                context_file += '<li><div class="material_editfile items_menu">' + wpmf.l18n.edit_file + '<span class="material-icons-outlined wpmf_icon"> edit </span></div></li>';
            }

            var copy_files_to_s3 = '';
            if (parseInt(wpmf.vars.copy_files_to_bucket) === 1) {
                copy_files_to_s3 = '<li><div class="material_copy_file_to_s3 items_menu">' + wpmf.l18n.copy_file_to_s3 + '<span class="material-icons-outlined wpmf_icon"> import_export </span></div></li>';
            }

            var download_media = '';
            if (wpmf.vars.enable_download_media) {
                download_media = '<li><a href="" class="material_downloadfile items_menu">' + wpmf.l18n.download + '<span class="material-icons-outlined wpmf_icon"> get_app </span></a></li>';
            }

            context_file += '\n            <li><div class="material_deletefile items_menu">' + wpmf.l18n.delete + '<span class="material-icons-outlined wpmf_icon"> delete_outline </span></div></li>\n                <li><div class="material_geturlfile items_menu">' + wpmf.l18n.get_url_file + '<span class="material-icons-outlined wpmf_icon"> link </span></div></li>\n                ' + download_media + '\n                ' + duplicate + '\n                ' + override + '\n                ' + copy_files_to_s3;

            if (parseInt(wpmf.vars.wpmf_active_media) === 1) {
                if (wpmf.vars.wpmf_role === 'administrator' || wpmf.vars.wpmf_role === 'editor') {
                    context_file += '<li><div class="set_folder_menu items_menu">' + wpmf.l18n.change_folder + '<span class="material-icons-outlined wpmf_icon"> snippet_folder </span></div></li>';
                }
            } else {
                context_file += '<li><div class="set_folder_menu items_menu">' + wpmf.l18n.change_folder + '<span class="material-icons-outlined wpmf_icon"> snippet_folder </span></div></li>';
            }

            context_file += '\n                <li><div class="material_import items_menu">' + wpmf.l18n.import_cloud + '<span class="material-icons-outlined wpmf_icon"> import_export </span></div></li>\n                <li class="insert_pdfembed_item hide"><div class="insert_pdfembed items_menu">' + wpmf.l18n.insert_pdfembed + '<span class="material-icons-outlined wpmf_icon"> send </span></div></li>\n                <li class="insert_image_lightbox_item hide"><div class="insert_image_lightbox items_menu">' + wpmf.l18n.insert_image_lightbox + '<span class="material-icons-outlined wpmf_icon"> send </span></div></li></ul>';

            // Add the context menu box for folder to body
            if (!$('.wpmf-contextmenu.wpmf-contextmenu-folder').length) {
                $('body').append(context_folder);
            }

            // Add the context menu box for attachment to body
            if (!$('.wpmf-contextmenu.wpmf-contextmenu-file').length) {
                $('body').append(context_file);
            }
        },

        /**
         * Open a lightbox to enter the new folder name
         *
         * @param parent_id id parent folder
         */
        newFolder: function newFolder(parent_id) {
            var options = {
                title: wpmf.l18n.create_folder,
                text: '<input type="text" name="wpmf_newfolder_input" class="wpmf_newfolder_input" placeholder="' + wpmf.l18n.new_folder + '">',
                negative: {
                    title: wpmf.l18n.cancel
                },
                positive: {
                    title: wpmf.l18n.create,
                    onClick: function onClick() {
                        // Call php script to create the folder
                        wpmfFoldersModule.createNewFolder($('.wpmf_newfolder_input').val(), parent_id);

                        // Hide the dialog
                        hideDialog(jQuery('#orrsDiag'));
                    }
                }
            };
            showDialog(options);

            // Bind the press enter key to submit the modal
            $('.wpmf_newfolder_input').focus().on('keypress', function (e) {
                if (e.which === 13) {
                    options.positive.onClick.call(this);
                }
            });
        },

        /**
         * Send ajax request to create a new folder
         *
         * @param name string new folder name
         * @param parent_id int parent folder
         */
        createNewFolder: function createNewFolder(name, parent_id) {
            return $.ajax({
                type: "POST",
                url: wpmf.vars.ajaxurl,
                data: {
                    action: "wpmf",
                    task: "add_folder",
                    name: name,
                    parent: parent_id,
                    wpmf_nonce: wpmf.vars.wpmf_nonce
                },
                beforeSend: function beforeSend() {
                    // Show snackbar
                    wpmfSnackbarModule.show({
                        id: 'upload_folder',
                        content: wpmf.l18n.wpmf_folder_adding,
                        auto_close: false,
                        is_progress: true
                    });
                },
                success: function success(response) {
                    if (response.status) {
                        if (wpmfFoldersModule.page_type === 'upload-list') {
                            // In list view reload the page
                            $('.upload-php #posts-filter').submit();
                            return;
                        }

                        // Update the categories variables
                        wpmfFoldersModule.categories = response.categories;
                        wpmfFoldersModule.categories_order = response.categories_order;

                        // Regenerate the folder filter
                        wpmfFoldersModule.initFolderFilter();

                        // Reload the folders
                        wpmfFoldersModule.renderFolders();

                        wpmfSnackbarModule.close('upload_folder');
                        // Show snackbar
                        wpmfSnackbarModule.show({
                            id: 'folder_added',
                            icon: '<span class="material-icons-outlined wpmf-snack-icon">create_new_folder</span>',
                            content: wpmf.l18n.wpmf_addfolder
                        });

                        wpmfFoldersModule.trigger('addFolder', response.term);
                    } else {
                        wpmfSnackbarModule.close('upload_folder');

                        // Show dialog when adding folder failed
                        showDialog({
                            title: wpmf.l18n.information, // todo : use the response message instead of a predefined one
                            text: response.msg,
                            closeicon: true
                        });
                    }
                }
            });
        },

        /**
         * Clicki on edit icon on a folder
         */
        clickEditFolder: function clickEditFolder(event, folder_id) {
            event.stopPropagation();

            // Retrieve the current folder name
            var name = wpmfFoldersModule.categories[folder_id].label;

            // Show the input dialog
            var options = {
                title: wpmf.l18n.promt,
                text: '<input type="text" name="wpmf_editfolder_input" class="wpmf_newfolder_input" value="' + name + '">',
                negative: {
                    title: wpmf.l18n.cancel
                },
                positive: {
                    title: wpmf.l18n.save,
                    onClick: function onClick() {
                        var new_name = $('.wpmf_newfolder_input').val();
                        if (new_name !== '' && new_name !== 'null') {
                            // Call php script to update folder name
                            wpmfFoldersModule.updateFolderName(folder_id, new_name);

                            // Close the dialog
                            hideDialog($('#orrsDiag'));
                        }
                    }
                }
            };
            showDialog(options);

            // Bind the press enter key to submit the modal
            $('.wpmf_newfolder_input').keypress(function (e) {
                if (e.which === 13) {
                    options.positive.onClick.call(this);
                }
            });
        },

        /**
         * Update folder name
         *
         * @param id int id of folder
         * @param name string new name of folder
         */
        updateFolderName: function updateFolderName(id, name) {
            return $.ajax({
                type: "POST",
                url: wpmf.vars.ajaxurl,
                data: {
                    action: "wpmf",
                    task: "edit_folder",
                    name: name,
                    id: id,
                    wpmf_nonce: wpmf.vars.wpmf_nonce
                },
                beforeSend: function beforeSend() {
                    // Show snackbar
                    if (!$('.wpmf-snackbar[data-id="edit_folder"]').length) {
                        wpmfSnackbarModule.show({
                            id: 'edit_folder',
                            content: wpmf.l18n.folder_editing,
                            auto_close: false,
                            is_progress: true
                        });
                    }
                },
                success: function success(response) {
                    var $snack = wpmfSnackbarModule.getFromId('edit_folder');
                    wpmfSnackbarModule.close('edit_folder');
                    if (!response.status) {
                        if (name !== wpmfFoldersModule.categories[id].label) {
                            // todo: why do we check that?
                            showDialog({
                                title: wpmf.l18n.information,
                                text: response.msg,
                                closeicon: true
                            });
                        }
                    } else {
                        // Store variables in case of undo
                        var old_name = wpmfFoldersModule.categories[id].label;

                        // Update the name in stored variables
                        wpmfFoldersModule.categories[id].label = response.details.name;

                        // Render folders to update name
                        wpmfFoldersModule.renderFolders();

                        if (wpmfFoldersModule.page_type === 'upload-list') {
                            // Update the name in select input with the same number of spaces
                            var $selected_option = $('#wpmf-media-category option[value="' + id + '"]');
                            $selected_option.html($selected_option.html().slice(0, $selected_option.html().lastIndexOf('&nbsp;')) + name);
                        } else {
                            // Update the select filter
                            wpmfFoldersModule.initFolderFilter();
                        }

                        // Show snackbar
                        wpmfSnackbarModule.show({
                            id: 'undo_editfolder',
                            content: wpmf.l18n.wpmf_undo_editfolder,
                            is_undoable: true,
                            onUndo: function onUndo() {
                                // Cancel delete folder
                                wpmfFoldersModule.updateFolderName(id, old_name);
                            }
                        });

                        wpmfFoldersModule.trigger('updateFolder', id);
                    }
                }
            });
        },

        /**
         * Delete folder click function in template
         * @param event Object
         * @param id int folder id to delete
         */
        clickDeleteFolder: function clickDeleteFolder(event, id) {
            event = event || window.event; // FF IE fix if event has not been passed in function

            event.stopPropagation();

            // Show an alter depending on if we delete also included images inside the folder
            var alert_delete = void 0;
            if (typeof wpmf.vars.wpmf_remove_media !== "undefined" && parseInt(wpmf.vars.wpmf_remove_media) === 1) {
                alert_delete = wpmf.l18n.alert_delete_all;
            } else {
                alert_delete = wpmf.l18n.alert_delete;
            }

            showDialog({
                title: alert_delete,
                negative: {
                    title: wpmf.l18n.cancel
                },
                positive: {
                    title: wpmf.l18n.delete,
                    onClick: function onClick() {
                        // Add effect in the folder deleted while we wait the response from server
                        $('.wpmf-attachment[data-id="' + id + '"]').css({ 'opacity': '0.5' });
                        $('.wpmf-attachment[data-id="' + id + '"] .wpmf-attachment-preview').append('<div class="wpmfdeletefolderprogress"> <div class="indeterminate"></div></div>');

                        wpmfFoldersModule.deleteFolder(id);
                    }
                }
            });
        },

        /**
         * Send ajax request to delete a folder
         * @param id
         */
        deleteFolder: function deleteFolder(id) {
            // Store some values in case of undo
            var old_folder_name = wpmfFoldersModule.categories[id].label,
                old_parent = wpmfFoldersModule.categories[id].parent_id;

            $.ajax({
                type: "POST",
                url: wpmf.vars.ajaxurl,
                data: {
                    action: "wpmf",
                    task: "delete_folder",
                    id: id,
                    wpmf_nonce: wpmf.vars.wpmf_nonce
                },
                beforeSend: function beforeSend() {
                    // Show snackbar
                    if (typeof wpmf.vars.wpmf_remove_media !== "undefined" && parseInt(wpmf.vars.wpmf_remove_media) === 1) {
                        if (!$('.wpmf-snackbar[data-id="deleting_folder"]').length) {
                            wpmfSnackbarModule.show({
                                id: 'deleting_folder',
                                content: wpmf.l18n.wpmf_folder_deleting,
                                auto_close: false,
                                is_progress: true
                            });
                        }
                    }
                },
                success: function success(response) {
                    if (response.status) {
                        if (wpmfFoldersModule.page_type === 'upload-list') {
                            // In list view reload the page
                            $('.upload-php #posts-filter').submit();
                            return;
                        }

                        // Update the categories variables
                        wpmfFoldersModule.categories = response.categories;
                        wpmfFoldersModule.categories_order = response.categories_order;

                        // Regenerate the folder filter
                        wpmfFoldersModule.initFolderFilter();

                        // Reload the folders
                        wpmfFoldersModule.renderFolders();

                        wpmfSnackbarModule.close('deleting_folder');
                        // Show snackbar
                        wpmfSnackbarModule.show({
                            id: 'undo_remove_folder',
                            content: wpmf.l18n.wpmf_undo_remove,
                            icon: '<span class="material-icons-outlined wpmf-snack-icon">delete_outline</span>',
                            is_undoable: true,
                            onUndo: function onUndo() {
                                // Cancel delete folder
                                wpmfFoldersModule.createNewFolder(old_folder_name, old_parent);
                            }
                        });

                        wpmfFoldersModule.trigger('deleteFolder', id);
                    } else {
                        if (typeof response.msg !== "undefined" && response.msg === 'limit') {
                            wpmfFoldersModule.deleteFolder(id);
                        } else {
                            // todo : show error message from json response
                            showDialog({
                                title: wpmf.l18n.information,
                                text: response.error,
                                closeicon: true
                            });
                            $('.wpmf-attachment[data-id="' + id + '"]').css({ 'opacity': 1 });
                        }
                    }
                }
            });
        },

        /**
         * Send ajax request to delete multiple folders
         * @param ids
         */
        deleteMultipleFolders: function deleteMultipleFolders(ids) {
            if (ids.length) {
                $.ajax({
                    type: "POST",
                    url: wpmf.vars.ajaxurl,
                    data: {
                        action: "wpmf",
                        task: "delete_multiple_folders",
                        id: ids.join(),
                        wpmf_nonce: wpmf.vars.wpmf_nonce
                    },
                    beforeSend: function beforeSend() {
                        // Show snackbar
                        if (!$('.wpmf-snackbar[data-id="deleting_folder"]').length) {
                            wpmfSnackbarModule.show({
                                id: 'deleting_folder',
                                content: wpmf.l18n.wpmf_folder_deleting,
                                auto_close: false,
                                is_progress: true
                            });
                        }
                    },
                    success: function success(response) {
                        if (response.status) {
                            if (wpmfFoldersModule.page_type === 'upload-list') {
                                // In list view reload the page
                                $('.upload-php #posts-filter').submit();
                                return;
                            }

                            // Update the categories variables
                            wpmfFoldersModule.categories = response.categories;
                            wpmfFoldersModule.categories_order = response.categories_order;

                            // Regenerate the folder filter
                            wpmfFoldersModule.initFolderFilter();

                            // Reload the folders
                            wpmfFoldersModule.renderFolders();

                            wpmfSnackbarModule.close('deleting_folder');
                            wpmfFoldersModule.trigger('deleteFolder');
                        } else {
                            if (typeof response.msg !== "undefined" && response.msg === 'limit') {
                                wpmfFoldersModule.deleteMultipleFolders(ids);
                            } else {
                                // todo : show error message from json response
                                showDialog({
                                    title: wpmf.l18n.information,
                                    text: response.error,
                                    closeicon: true
                                });
                                $('.wpmf-attachment[data-id="' + id + '"]').css({ 'opacity': 1 });
                            }
                        }
                    }
                });
            }
        },

        /**
         * Delete file click function in template
         * @param event Object
         * @param id int file id to delete
         */
        clickDeleteFile: function clickDeleteFile(event, id) {
            showDialog({
                title: wpmf.l18n.alert_delete_file,
                negative: {
                    title: wpmf.l18n.cancel
                },
                positive: {
                    title: wpmf.l18n.remove,
                    onClick: function onClick() {
                        wpmfFoldersModule.deletefile(id);
                    }
                }
            });
        },

        /**
         * Send ajax request to delete a file
         * @param id
         */
        deletefile: function deletefile(id) {
            // Store some values in case of undo
            return $.ajax({
                type: "POST",
                url: wpmf.vars.ajaxurl,
                data: {
                    action: "wpmf",
                    task: "delete_file",
                    id: id,
                    wpmf_nonce: wpmf.vars.wpmf_nonce
                },
                success: function success(response) {
                    if (response.status) {
                        wpmfFoldersModule.trigger('deleteFile', wpmfFoldersModule.last_selected_folder);
                        wpmfFoldersModule.reloadAttachments();
                    }
                }
            });
        },

        /**
         * Change the breadcrumb content
         * depending on the selected folder
         *
         * @param term_id
         */
        updateBreadcrumb: function updateBreadcrumb(term_id) {
            if (typeof term_id === "undefined") {
                term_id = wpmfFoldersModule.getCurrentFolderId();
            } else {
                // Let's save this term as the last used one
                wpmfFoldersModule.last_selected_folder = term_id;
            }

            // Get breadcrumb element
            var $wpmf_breadcrumb = wpmfFoldersModule.getFrame().find('#wpmf-breadcrumb');

            // Remove breadcrumb content
            $wpmf_breadcrumb.html(null);
            var category = wpmfFoldersModule.categories[term_id];
            var breadcrumb_content = '';

            // Ascend until there is no more parent
            while (parseInt(category.parent_id) !== parseInt(wpmf.vars.parent)) {
                // Generate breadcrumb element
                breadcrumb_content = '<li>&nbsp;&nbsp;/&nbsp;&nbsp;<a href="#" data-id="' + wpmfFoldersModule.categories[category.id].id + '">' + wpmfFoldersModule.categories[category.id].label + '</a></li>' + breadcrumb_content;

                // Get the parent
                category = wpmfFoldersModule.categories[wpmfFoldersModule.categories[category.id].parent_id];
            }

            if (parseInt(category.id) !== 0) {
                breadcrumb_content = '<li><a href="#" data-id="' + wpmfFoldersModule.categories[category.id].id + '">' + wpmfFoldersModule.categories[category.id].label + '</a></li>' + breadcrumb_content;
            }

            breadcrumb_content = '<li><span>' + wpmf.l18n.youarehere + '</span>&nbsp;&nbsp;:<a href="#" data-id="0">&nbsp;&nbsp;' + wpmfFoldersModule.categories[0].label + '&nbsp;&nbsp;</a>/&nbsp;&nbsp;</li>' + breadcrumb_content;

            // Finally update breadcrumb content
            $wpmf_breadcrumb.prepend(breadcrumb_content);

            /* bind breadcrumb click event */
            $wpmf_breadcrumb.find('a').on('click', function () {
                wpmfFoldersModule.changeFolder($(this).data('id'));
            });
        },

        /**
         * Get current folder id
         */
        getCurrentFolderId: function getCurrentFolderId() {
            // If not term id is set we use the latest used
            if (typeof wpmfFoldersModule.categories[wpmfFoldersModule.last_selected_folder] === "undefined") {
                return 0;
            } else {
                return wpmfFoldersModule.last_selected_folder;
            }
        },

        /**
         * get breadcrumb content
         * depending on the selected folder
         *
         * @param term_id
         */
        getBreadcrumb: function getBreadcrumb(term_id) {
            if (typeof term_id === 'undefined') {
                term_id = wpmfFoldersModule.getCurrentFolderId();
            } else {
                // Let's save this term as the last used one
                wpmfFoldersModule.last_selected_folder = term_id;
            }

            // Get breadcrumb element
            var $wpmf_breadcrumb = wpmfFoldersModule.getFrame().find('#wpmf-breadcrumb');
            var category = wpmfFoldersModule.categories[term_id];
            var breadcrumb_content = '';

            // Ascend until there is no more parent
            while (parseInt(category.parent_id) !== parseInt(wpmf.vars.parent)) {
                // Generate breadcrumb element
                breadcrumb_content = '&nbsp;&nbsp;/&nbsp;&nbsp;' + wpmfFoldersModule.categories[category.id].label + breadcrumb_content;

                // Get the parent
                category = wpmfFoldersModule.categories[wpmfFoldersModule.categories[category.id].parent_id];
            }

            if (parseInt(category.id) !== 0) {
                breadcrumb_content = wpmfFoldersModule.categories[category.id].label + breadcrumb_content;
            }

            breadcrumb_content = '&nbsp;&nbsp;' + wpmf.l18n.home + '&nbsp;&nbsp;/&nbsp;&nbsp;' + breadcrumb_content;
            return breadcrumb_content;
        },

        /**
         * Initialize dragging and dropping folders and files
         */
        initializeDragAndDropAttachments: function initializeDragAndDropAttachments() {
            // Initialize draggable
            var $frame = wpmfFoldersModule.getFrame();
            var draggable_attachments = 'ul.attachments .attachment:not(.attachment.loading):not(.wpmf-new):not(.wpmf-back):not(.ui-droppable):not(.ui-state-disabled)';
            var append_element = void 0;

            if (wpmfFoldersModule.page_type === 'upload-list') {
                append_element = '.upload-php #posts-filter';
                draggable_attachments += ', #the-list tr';
            } else {
                draggable_attachments = '.attachments-browser ' + draggable_attachments;
                append_element = '.media-frame';
            }

            var items_sortable = '';
            var preview_sortable = '';
            var placeholder = '';
            var accept = '.attachment:not(.wpmf-back):not(.wpmf-new), #the-list tr';
            var order_folder = wpmfFoldersModule.getCookie('media-order-folder' + wpmf.vars.host);
            if (typeof order_folder === "undefined") {
                order_folder = 'name-ASC';
            }

            var order_media = wpmfFoldersModule.getCookie('media-order-media' + wpmf.vars.host);
            if (typeof order_media === "undefined") {
                order_media = 'date|desc';
            }

            if (order_folder === 'custom' && order_media !== 'custom') {
                if (wpmfFoldersModule.page_type === 'upload-list') {
                    accept = '#the-list tr';
                } else {
                    accept = '.attachment.save-ready';
                }
                wpmfFoldersModule.sortableFolder($frame, append_element);

                if (wpmfFoldersModule.page_type === 'upload-list') {
                    wpmfFoldersModule.draggableFile($frame, '#the-list tr', append_element);
                } else {
                    wpmfFoldersModule.draggableFile($frame, 'ul.attachments .attachment:not(.wpmf-attachment)', append_element);
                }
            } else if (order_folder !== 'custom' && order_media === 'custom') {
                if (wpmfFoldersModule.page_type === 'upload-list') {
                    items_sortable = draggable_attachments;
                    preview_sortable = '.upload-php .wp-list-table.media';
                    placeholder = 'wpmf-highlight';
                } else {
                    items_sortable = '.attachment.save-ready';
                    preview_sortable = '.attachments';
                    placeholder = 'attachment';
                }

                // if set custom media order filter
                wpmfFoldersModule.sortableFile($frame, append_element, items_sortable, preview_sortable, placeholder);
                wpmfFoldersModule.draggableFile($frame, 'ul.attachments .wpmf-attachment:not(.wpmf-new):not(.wpmf-back):not(.ui-droppable)', append_element);
            } else if (order_folder === 'custom' && order_media === 'custom') {
                if (wpmfFoldersModule.page_type === 'upload-list') {
                    items_sortable = draggable_attachments;
                    preview_sortable = '.upload-php .wp-list-table.media, .attachments';
                    accept = '#the-list tr';
                } else {
                    items_sortable = '.attachment:not(.ui-state-disabled)';
                    preview_sortable = '.attachments';
                    accept = '.attachment.save-ready';
                }
                wpmfFoldersModule.sortableAll($frame, preview_sortable, append_element, items_sortable);
            } else {
                if (wpmfFoldersModule.page_type === 'upload-list') {
                    accept = '#the-list tr, .wpmf-folder:not(.wpmf-back)';
                } else {
                    accept = '.attachment';
                }
                wpmfFoldersModule.draggableFile($frame, draggable_attachments, append_element);
            }

            // Initialize droppable on folders
            var droppable_element = 'ul.attachments .wpmf-folder';
            if (wpmfFoldersModule.page_type !== 'upload-list') {
                droppable_element = '.attachments-browser ' + droppable_element;
            }

            if (!$().droppable) {
                return;
            }

            $frame.find(droppable_element).droppable({
                hoverClass: "wpmf-hover-folder",
                tolerance: 'pointer',
                accept: accept,
                drop: function drop(event, ui) {
                    $(ui.helper).addClass('wpmf_dragout');
                    wpmfFoldersModule.droppedAttachment($(this).data('id'));
                }
            });
        },

        /**
         * Drag file
         * @param $frame
         * @param draggable_attachments
         * @param append_element
         */
        draggableFile: function draggableFile($frame, draggable_attachments, append_element) {
            if (!$().draggable) {
                return;
            }

            if (wp !== undefined && wp.media !== undefined && wp.media.frame !== undefined && wp.media.frame._state === 'gallery-edit') {
                return;
            }

            $frame.find(draggable_attachments).draggable({
                helper: function helper(ui) {
                    var helper = '<div class="wpmf-move-element">';
                    if ($(ui.currentTarget).hasClass('wpmf-folder')) {
                        helper += '<span class="mdc-list-item__start-detail"><i class="material-icons">folder</i></span>';
                        helper += '<span class="mdc-list-item__text"> ' + wpmf.l18n.folder_moving_text + ' </span>';
                    } else {
                        helper += '<span class="mdc-list-item__start-detail"><i class="material-icons-outlined">description</i></span>';
                        helper += '<span class="mdc-list-item__text"></span>';
                    }
                    helper += '</div>';
                    return helper;
                },
                appendTo: append_element,
                delay: $(window).width() < 450 ? 500 : 100, // Prevent dragging when only trying to click
                distance: 10,
                revert: true,
                revertDuration: 1000,
                cursorAt: { top: 10, left: 10 },
                drag: function drag() {},
                start: function start(event, ui) {
                    // Save the element we drag in a variable to use this later
                    wpmfFoldersModule.dragging_elements = [this];
                    // Add the original size of element
                    $(ui.helper).css('width', $(ui.helper.context).outerWidth() + 'px');
                    $(ui.helper).css('height', $(ui.helper.context).outerWidth() + 'px');
                    if (!$(this).hasClass('wpmf-folder')) {
                        // We're moving a file, it could be multiple files dragging
                        if (wpmfFoldersModule.page_type === 'upload-list') {
                            // Save the element we drag in a variable to use this later
                            $frame.find('#the-list input[name="media[]"]:checked:not(".ui-draggable-dragging")').closest('tr').each(function () {
                                if (this !== wpmfFoldersModule.dragging_elements[0]) {
                                    // Check that the element is not already in the list
                                    wpmfFoldersModule.dragging_elements.push(this);
                                }
                            });
                        } else {
                            $frame.find('.attachments-browser ul.attachments .attachment[aria-checked="true"]:not(".ui-draggable-dragging")').each(function () {
                                if (this !== wpmfFoldersModule.dragging_elements[0]) {
                                    // Check that the element is not already in the list
                                    wpmfFoldersModule.dragging_elements.push(this);
                                }
                            });
                        }

                        if (wpmfFoldersModule.dragging_elements.length > 1) {
                            $('.wpmf-move-element .mdc-list-item__text').text(wpmf.l18n.moving + ' ' + wpmfFoldersModule.dragging_elements.length + ' ' + wpmf.l18n.files);
                        } else {
                            $('.wpmf-move-element .mdc-list-item__text').text(wpmf.l18n.moving + ' ' + wpmf.l18n.file);
                        }
                    }

                    // Add some style to original elements
                    $(wpmfFoldersModule.dragging_elements).each(function () {
                        $(this).addClass('wpmf-dragging');
                    });
                },
                stop: function stop(event, ui) {
                    // Revert style
                    $(wpmfFoldersModule.dragging_elements).each(function () {
                        $(this).removeClass('wpmf-dragging');
                    });
                    wpmfFoldersModule.dragging_elements = null;
                }
            });
        },

        sortableAll: function sortableAll($frame, preview_sortable, append_element, items_sortable) {
            if (wpmfFoldersModule.page_type === 'upload-list') {
                // sortable folder
                var placeholder = '';
                placeholder = 'mdc-list-item attachment wpmf-attachment material_design wpmf-folder mdc-ripple-upgraded wpmf-transparent';
                $('.attachments').sortable({
                    placeholder: placeholder,
                    revert: true,
                    items: '.wpmf-folder:not(.wpmf-back)',
                    distance: 5,
                    tolerance: "pointer",
                    appendTo: append_element,
                    helper: function helper(e, item) {
                        return $(item).clone();
                    },
                    /** Prevent firefox bug positionnement **/
                    start: function start(event, ui) {},
                    stop: function stop(event, ui) {},
                    beforeStop: function beforeStop(event, ui) {
                        var userAgent = navigator.userAgent.toLowerCase();
                        if (ui.offset !== "undefined" && userAgent.match(/firefox/)) {
                            ui.helper.css('margin-top', 0);
                        }
                    },
                    update: function update() {
                        var order = '';
                        $.each($('.attachments .wpmf-folder'), function (i, val) {
                            if (order !== '') {
                                order += ',';
                            }
                            order += '"' + i + '":' + $(val).data('id');
                            wpmfFoldersModule.categories[$(val).data('id')].order = i;
                        });
                        order = '{' + order + '}';

                        // do re-order file
                        $.ajax({
                            type: "POST",
                            url: wpmf.vars.ajaxurl,
                            data: {
                                action: "wpmf",
                                task: "reorderfolder",
                                order: order,
                                wpmf_nonce: wpmf.vars.wpmf_nonce
                            },
                            success: function success(response) {
                                wpmfFoldersModule.trigger('foldersOrderChanged');
                            }
                        });
                    }
                });

                // sortable file
                placeholder = '';
                placeholder = 'mdc-list-item attachment wpmf-attachment material_design wpmf-folder mdc-ripple-upgraded wpmf-transparent';
                $('.upload-php .wp-list-table.media').sortable({
                    placeholder: 'wpmf-highlight',
                    revert: true,
                    distance: 5,
                    items: '.wp-list-table.media #the-list > tr',
                    tolerance: "pointer",
                    appendTo: append_element,
                    helper: function helper(e, item) {
                        if (wpmfFoldersModule.page_type === 'upload-list' && $(item).is('tr')) {
                            var label = $(item).find('.filename span').text();
                            var full_label = $(item).find('.filename').text();
                            var filename = full_label.replace(label, "");
                            return '<div class="wpmf-file-handle"><div>' + filename + '</div></div>';
                        } else {
                            return $(item).clone();
                        }
                    },
                    /** Prevent firefox bug positionnement **/
                    start: function start(event, ui) {
                        // Save the element we drag in a variable to use this later
                        wpmfFoldersModule.dragging_elements = [$(ui.item)];

                        // Add the original size of element
                        if (!$($(ui.helper)).hasClass('wpmf-folder')) {
                            // Save the element we drag in a variable to use this later
                            $frame.find('#the-list input[name="media[]"]:checked:not(".ui-draggable-dragging")').closest('tr').each(function () {
                                if (this !== wpmfFoldersModule.dragging_elements[0][0]) {
                                    // Check that the element is not already in the list
                                    wpmfFoldersModule.dragging_elements.push($(this));
                                }
                            });
                        }

                        var cols = $('.wp-list-table.media thead tr th').length + $('.wp-list-table.media thead tr td').length;
                        ui.placeholder.html("<td colspan='" + cols + "'></td>");
                    },
                    stop: function stop(event, ui) {
                        wpmfFoldersModule.dragging_elements = null;
                    },
                    beforeStop: function beforeStop(event, ui) {
                        var userAgent = navigator.userAgent.toLowerCase();
                        if (ui.offset !== "undefined" && userAgent.match(/firefox/)) {
                            ui.helper.css('margin-top', 0);
                        }
                    },
                    beforeRevert: function beforeRevert(e, ui) {
                        return true;
                    },
                    update: function update() {
                        var order = '';
                        var element = '';
                        $.each($('.wp-list-table.media #the-list > tr'), function (i, val) {
                            var string_id = $(val).attr('id');
                            if (order !== '') {
                                order += ',';
                            }
                            order += '"' + i + '":' + string_id.replace("post-", "");
                        });
                        order = '{' + order + '}';

                        // do re-order file
                        $.ajax({
                            type: "POST",
                            url: wpmf.vars.ajaxurl,
                            data: {
                                action: "wpmf",
                                task: "reorderfile",
                                order: order,
                                wpmf_nonce: wpmf.vars.wpmf_nonce
                            },
                            success: function success(response) {
                                if (wpmfFoldersModule.page_type !== 'upload-list') {
                                    wpmfFoldersModule.reloadAttachments();
                                }
                            }
                        });
                    }
                });

                $(".upload-php .wp-list-table.media").disableSelection();
            } else {
                var _placeholder = '';
                $('.attachments').sortable({
                    placeholder: '',
                    revert: true,
                    cancel: ".ui-state-disabled",
                    items: '.attachment:not(.ui-state-disabled):not(.wpmf-new):not(.wpmf-back)',
                    distance: 5,
                    tolerance: "pointer",
                    appendTo: append_element,
                    helper: function helper(e, item) {
                        return $(item).clone();
                    },
                    /** Prevent firefox bug positionnement **/
                    start: function start(event, ui) {
                        if ($(ui.item).hasClass('attachment save-ready')) {
                            $('.wpmf-attachment').addClass('ui-state-disabled');
                            _placeholder = 'attachment';
                        } else {
                            $('.attachment.save-ready').addClass('ui-state-disabled');
                            _placeholder = 'mdc-list-item attachment wpmf-attachment material_design wpmf-folder mdc-ripple-upgraded wpmf-transparent';
                        }
                        $(ui.placeholder).addClass(_placeholder);
                        wpmfFoldersModule.dragging_elements = [$(ui.item)];

                        // Add the original size of element
                        if (!$($(ui.helper)).hasClass('wpmf-folder')) {
                            // We're moving a file, it could be multiple files dragging
                            $frame.find('.attachments-browser ul.attachments .attachment[aria-checked="true"]:not(".ui-draggable-dragging")').each(function () {
                                if (this !== wpmfFoldersModule.dragging_elements[0][0]) {
                                    // Check that the element is not already in the list
                                    wpmfFoldersModule.dragging_elements.push($(this));
                                }
                            });
                        }
                        ui.placeholder.html("<div></div>");
                    },
                    stop: function stop(event, ui) {
                        $('.attachment').removeClass('ui-state-disabled');
                    },
                    beforeStop: function beforeStop(event, ui) {
                        var userAgent = navigator.userAgent.toLowerCase();
                        if (ui.offset !== "undefined" && userAgent.match(/firefox/)) {
                            ui.helper.css('margin-top', 0);
                        }
                    },
                    update: function update(event, ui) {
                        if ($(ui.item).hasClass('wpmf-folder')) {
                            var order = '';
                            $.each($('.attachments .wpmf-folder'), function (i, val) {
                                if (order !== '') {
                                    order += ',';
                                }
                                order += '"' + i + '":' + $(val).data('id');
                                wpmfFoldersModule.categories[$(val).data('id')].order = i;
                            });
                            order = '{' + order + '}';

                            // do re-order file
                            $.ajax({
                                type: "POST",
                                url: wpmf.vars.ajaxurl,
                                data: {
                                    action: "wpmf",
                                    task: "reorderfolder",
                                    order: order,
                                    wpmf_nonce: wpmf.vars.wpmf_nonce
                                },
                                success: function success() {
                                    wpmfFoldersModule.trigger('foldersOrderChanged');
                                }
                            });
                        } else {
                            var _order = '';
                            if (wpmfFoldersModule.page_type === 'upload-list') {
                                $.each($('.wp-list-table.media #the-list > tr'), function (i, val) {
                                    var string_id = $(val).attr('id');
                                    if (_order !== '') {
                                        _order += ',';
                                    }
                                    _order += '"' + i + '":' + string_id.replace("post-", "");
                                });
                                _order = '{' + _order + '}';
                            } else {
                                $.each($('.attachments .attachment:not(.wpmf-attachment)'), function (i, val) {
                                    if (_order !== '') {
                                        _order += ',';
                                    }
                                    _order += '"' + i + '":' + $(val).data('id');
                                });
                                _order = '{' + _order + '}';
                            }

                            // do re-order file
                            $.ajax({
                                type: "POST",
                                url: wpmf.vars.ajaxurl,
                                data: {
                                    action: "wpmf",
                                    task: "reorderfile",
                                    order: _order,
                                    wpmf_nonce: wpmf.vars.wpmf_nonce
                                },
                                success: function success(response) {
                                    if (wpmfFoldersModule.page_type !== 'upload-list') {
                                        wpmfFoldersModule.reloadAttachments();
                                    }
                                }
                            });
                        }
                    }
                });

                $(".attachments").disableSelection();
            }
        },

        /**
         * Custom order
         * @param $frame
         * @param append_element
         */
        sortableFolder: function sortableFolder($frame, append_element) {
            var placeholder = 'mdc-list-item attachment wpmf-attachment material_design wpmf-folder mdc-ripple-upgraded wpmf-transparent';
            if (wpmfFoldersModule.page_type !== 'upload-list') {
                $('.attachments').sortable();
                $('.attachments').sortable('enable');
            }

            $('.attachments').sortable({
                placeholder: placeholder,
                revert: true,
                distance: 5,
                items: '.wpmf-folder:not(.wpmf-back)',
                tolerance: "pointer",
                appendTo: append_element,
                helper: function helper(e, item) {
                    return $(item).clone();
                },
                /** Prevent firefox bug positionnement **/
                start: function start(event, ui) {},
                stop: function stop(event, ui) {},
                beforeStop: function beforeStop(event, ui) {
                    var userAgent = navigator.userAgent.toLowerCase();
                    if (ui.offset !== "undefined" && userAgent.match(/firefox/)) {
                        ui.helper.css('margin-top', 0);
                    }
                },
                update: function update() {
                    var order = '';
                    $.each($('.attachments .wpmf-folder'), function (i, val) {
                        if (order !== '') {
                            order += ',';
                        }
                        order += '"' + i + '":' + $(val).data('id');
                        wpmfFoldersModule.categories[$(val).data('id')].order = i;
                    });
                    order = '{' + order + '}';

                    // do re-order file
                    $.ajax({
                        type: "POST",
                        url: wpmf.vars.ajaxurl,
                        data: {
                            action: "wpmf",
                            task: "reorderfolder",
                            order: order,
                            wpmf_nonce: wpmf.vars.wpmf_nonce
                        },
                        success: function success() {
                            wpmfFoldersModule.trigger('foldersOrderChanged');
                        }
                    });
                }
            }).disableSelection();
        },

        /**
         * Custom order
         * @param $frame
         * @param append_element
         * @param items
         * @param preview
         * @param placeholder
         */
        sortableFile: function sortableFile($frame, append_element, items, preview, placeholder) {
            if (wpmfFoldersModule.page_type !== 'upload-list') {
                $(preview).sortable();
            }
            $(preview).sortable({
                placeholder: placeholder,
                revert: true,
                distance: 10,
                cursorAt: { top: 10, left: 10 },
                items: items,
                tolerance: "pointer",
                appendTo: append_element,
                helper: function helper(e, item) {
                    var helper = '<div class="wpmf-move-element">';
                    helper += '<span class="mdc-list-item__start-detail" role="presentation"><i class="material-icons-outlined">description</i></span>';
                    helper += '<span class="mdc-list-item__text"> ' + wpmf.l18n.file_moving_text + ' </span>';
                    helper += '</div>';
                    return helper;
                },
                /** Prevent firefox bug positionnement **/
                start: function start(event, ui) {
                    // Save the element we drag in a variable to use this later
                    wpmfFoldersModule.dragging_elements = [$(ui.item)];
                    // Add the original size of element
                    if (!$($(ui.helper)).hasClass('wpmf-folder')) {
                        // We're moving a file, it could be multiple files dragging
                        if (wpmfFoldersModule.page_type === 'upload-list') {
                            // Save the element we drag in a variable to use this later
                            $frame.find('#the-list input[name="media[]"]:checked:not(".ui-draggable-dragging")').closest('tr').each(function () {
                                if (this !== wpmfFoldersModule.dragging_elements[0][0]) {
                                    // Check that the element is not already in the list
                                    wpmfFoldersModule.dragging_elements.push($(this));
                                }
                            });
                        } else {
                            $frame.find('.attachments-browser ul.attachments .attachment[aria-checked="true"]:not(".ui-draggable-dragging")').each(function () {
                                if (this !== wpmfFoldersModule.dragging_elements[0][0]) {
                                    // Check that the element is not already in the list
                                    wpmfFoldersModule.dragging_elements.push($(this));
                                }
                            });
                        }
                    }

                    if (wpmfFoldersModule.page_type === 'upload-list') {
                        var cols = $('.wp-list-table.media thead tr th').length + $('.wp-list-table.media thead tr td').length;
                        ui.placeholder.html("<td colspan='" + cols + "'></td>");
                    } else {
                        ui.placeholder.html("<div></div>");
                    }
                },
                stop: function stop(event, ui) {
                    wpmfFoldersModule.dragging_elements = null;
                },
                beforeStop: function beforeStop(event, ui) {
                    var userAgent = navigator.userAgent.toLowerCase();
                    if (ui.offset !== "undefined" && userAgent.match(/firefox/)) {
                        ui.helper.css('margin-top', 0);
                    }
                },
                beforeRevert: function beforeRevert(e, ui) {
                    return true;
                },
                update: function update() {
                    var order = '';
                    if (wpmfFoldersModule.page_type === 'upload-list') {
                        $.each($('.wp-list-table.media #the-list > tr'), function (i, val) {
                            var string_id = $(val).attr('id');
                            if (order !== '') {
                                order += ',';
                            }
                            order += '"' + i + '":' + string_id.replace("post-", "");
                        });
                        order = '{' + order + '}';
                    } else {
                        $.each($('.attachments .attachment:not(.wpmf-attachment)'), function (i, val) {
                            if (order !== '') {
                                order += ',';
                            }
                            order += '"' + i + '":' + $(val).data('id');
                        });
                        order = '{' + order + '}';
                    }

                    // do re-order file
                    $.ajax({
                        type: "POST",
                        url: wpmf.vars.ajaxurl,
                        data: {
                            action: "wpmf",
                            task: "reorderfile",
                            order: order,
                            wpmf_nonce: wpmf.vars.wpmf_nonce
                        },
                        success: function success(response) {
                            if (wpmfFoldersModule.page_type !== 'upload-list') {
                                wpmfFoldersModule.reloadAttachments();
                            }
                        }
                    });
                }
            });

            $(".attachments").disableSelection();
        },

        /**
         * Function called when an attachment is dropped in a folder
         * @param to_folder_id
         */
        droppedAttachment: function droppedAttachment(to_folder_id) {
            if ($(wpmfFoldersModule.dragging_elements).hasClass('wpmf-folder')) {
                // We're dropping a folder
                // Send request to move folder
                wpmfFoldersModule.moveFolder($(wpmfFoldersModule.dragging_elements).data('id'), to_folder_id);
            } else {
                // We're dropping an attachment
                var files_ids = [];

                // Retrieve the ids of files dragged
                $(wpmfFoldersModule.dragging_elements).each(function () {
                    if (wpmfFoldersModule.page_type === 'upload-list') {
                        var row_ids = $(this).attr('id');
                        var row_id = row_ids.split('-');
                        var file_id = parseInt(row_id[1]);
                        if (files_ids.indexOf(file_id) === -1) {
                            files_ids.push(file_id);
                        }
                    } else {
                        files_ids.push($(this).data('id'));
                    }
                });

                // Send request to move files
                wpmfFoldersModule.moveFile(files_ids, to_folder_id, wpmfFoldersModule.last_selected_folder);
            }
        },

        /**
         * Move a folder inside another folder
         *
         * @param folder_id int folder we're moving
         * @param folder_to_id int folder we're moving into
         * @return jqXHR
         */
        moveFolder: function moveFolder(folder_id, folder_to_id) {
            // Store parent id in order to use it in the undo function
            var parent_id = wpmfFoldersModule.categories[folder_id].parent_id;

            return $.ajax({
                type: "POST",
                url: wpmf.vars.ajaxurl,
                data: {
                    action: "wpmf",
                    task: "move_folder",
                    id: folder_id,
                    id_category: folder_to_id,
                    type: 'move', // todo: handle the undo feature
                    wpmf_nonce: wpmf.vars.wpmf_nonce
                },
                beforeSend: function beforeSend() {
                    // Show snackbar
                    if (!$('.wpmf-snackbar[data-id="moving_folder"]').length) {
                        wpmfSnackbarModule.show({
                            id: 'moving_folder',
                            content: wpmf.l18n.folder_moving,
                            auto_close: false,
                            is_progress: true
                        });
                    }
                },
                success: function success(response) {
                    if (response.status) {
                        // Update the categories variables
                        wpmfFoldersModule.categories = response.categories;
                        wpmfFoldersModule.categories_order = response.categories_order;

                        // Reload the folders
                        wpmfFoldersModule.renderFolders();

                        // Trigger event
                        wpmfFoldersModule.trigger('moveFolder', folder_id, folder_to_id);

                        wpmfSnackbarModule.close('moving_folder');
                        // Show snackbar
                        wpmfSnackbarModule.show({
                            id: 'undo_movefolder',
                            content: wpmf.l18n.wpmf_undo_movefolder,
                            icon: '<span class="material-icons-outlined wpmf-snack-icon">trending_flat</span>',
                            is_undoable: true,
                            onUndo: function onUndo() {
                                // Move back to old folder
                                wpmfFoldersModule.moveFolder(folder_id, parent_id);
                            }
                        });
                    } else {
                        wpmfSnackbarModule.close('moving_folder');
                        if (typeof response.msg !== "undefined") {
                            //todo: change wrong variable name to something more understandable like message or error_message, and what should we do if wrong is set?
                            showDialog({
                                title: wpmf.l18n.information,
                                text: response.msg,
                                closeicon: true
                            });
                        }
                    }
                }
            });
        },

        /**
         * Move a file into a folder
         *
         * @param files_ids array(int) Array of files to move
         * @param folder_to_id int folder to move the files into
         * @param folder_from_id int folder we move the file from
         * @return jqXHR
         */
        moveFile: function moveFile(files_ids, folder_to_id, folder_from_id) {
            var undo = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

            if (parseInt(folder_to_id) === parseInt(folder_from_id)) {
                return;
            }

            if (typeof wpmfFoldersModule.categories[folder_to_id].drive_type !== "undefined" && wpmfFoldersModule.categories[folder_to_id].drive_type !== '') {
                var check = true;
                $.each(files_ids, function (i, id) {
                    var size = wp.media.attachment(id).get('filesizeInBytes');
                    var cloud_media = wp.media.attachment(id).get('cloud_media');
                    if (size > 25165824 && parseInt(cloud_media) === 0) {
                        check = false;
                        return false;
                    }
                });

                if (!check) {
                    showDialog({
                        title: wpmf.l18n.information,
                        text: wpmf.l18n.move_confirm_msg,
                        negative: {
                            title: wpmf.l18n.cancel
                        },
                        positive: {
                            title: wpmf.l18n.proceed,
                            onClick: function onClick() {
                                wpmfFoldersModule.doMoveFile(files_ids, folder_to_id, folder_from_id, undo);
                            }
                        }
                    });
                } else {
                    wpmfFoldersModule.doMoveFile(files_ids, folder_to_id, folder_from_id, undo);
                }
            } else {
                wpmfFoldersModule.doMoveFile(files_ids, folder_to_id, folder_from_id, undo);
            }
        },

        doMoveFile: function doMoveFile(files_ids, folder_to_id, folder_from_id, undo) {
            $.ajax({
                type: "POST",
                url: wpmf.vars.ajaxurl,
                data: {
                    action: "wpmf",
                    task: "move_file",
                    ids: files_ids,
                    id_category: folder_to_id,
                    current_category: folder_from_id,
                    type: 'move', // todo: handle the undo feature
                    wpmf_nonce: wpmf.vars.wpmf_nonce
                },
                beforeSend: function beforeSend() {
                    // Show snackbar
                    if (!$('.wpmf-snackbar[data-id="moving_file"]').length) {
                        wpmfSnackbarModule.show({
                            id: 'moving_file',
                            content: files_ids.length > 1 ? files_ids.length + ' ' + wpmf.l18n.files_moving : wpmf.l18n.file_moving,
                            icon: '<span class="material-icons-outlined wpmf-snack-icon"> snippet_folder </span>',
                            auto_close: false,
                            is_progress: true
                        });
                    }
                },
                success: function success(response) {
                    if (response.status) {
                        if (wpmfFoldersModule.page_type === 'upload-list') {
                            location.reload();
                            return;
                        }

                        // reload attachment after move file
                        if (!$('.display-all-media .check').length || $('.display-all-media .check').length && parseInt(wpmfFoldersModule.last_selected_folder) !== 0) {
                            $.each(files_ids, function (i, v) {
                                $('.attachment[data-id="' + v + '"]').remove();
                            });
                        }

                        if (!undo) {
                            wpmfFoldersModule.reload_attachment = false;
                        } else {
                            var order_media = $('#media-order-media').val();
                            // if set custom media order filter
                            if (order_media === 'custom') {
                                setTimeout(function () {
                                    wpmfFoldersModule.reloadAttachments();
                                }, 400);
                            } else {
                                wpmfFoldersModule.reloadAttachments();
                            }
                            wpmfFoldersModule.reload_attachment = true;
                        }

                        if ($('.mode-select .select-mode-toggle-button').length) {
                            $('.mode-select .select-mode-toggle-button').click();
                        }

                        if ($('.selection-info .clear-selection').length) {
                            $('.selection-info .clear-selection').click();
                        }

                        wpmfSnackbarModule.close('moving_file');
                        wpmfFoldersModule.categories[folder_from_id].files_count -= files_ids.length;
                        wpmfFoldersModule.categories[folder_to_id].files_count += files_ids.length;
                        wpmfFoldersModule.trigger('moveFile', files_ids, folder_to_id, folder_from_id);

                        if (typeof response.is_local_to_cloud !== "undefined" && !response.is_local_to_cloud) {
                            // Show snackbar
                            wpmfSnackbarModule.show({
                                id: 'undo_movefile',
                                content: files_ids.length > 1 ? files_ids.length + ' ' + wpmf.l18n.files_moved : wpmf.l18n.file_moved,
                                icon: '<span class="material-icons-outlined wpmf-snack-icon"> snippet_folder </span>',
                                is_undoable: true,
                                onUndo: function onUndo() {
                                    // Cancel moving files
                                    wpmfFoldersModule.moveFile(files_ids, folder_from_id, folder_to_id, true);
                                }
                            });
                        } else {
                            wpmfSnackbarModule.show({
                                id: 'undo_movefile',
                                content: files_ids.length > 1 ? files_ids.length + ' ' + wpmf.l18n.files_moved : wpmf.l18n.file_moved,
                                icon: '<span class="material-icons-outlined wpmf-snack-icon"> snippet_folder </span>',
                                is_undoable: false
                            });
                            $(document).trigger('move_queue_status', files_ids.length);
                        }
                    } else {
                        if (typeof response.msg !== "undefined") {
                            wpmfSnackbarModule.close('moving_file');
                            showDialog({
                                title: wpmf.l18n.information,
                                text: response.msg,
                                closeicon: true
                            });
                        }
                    }
                }
            });
        },

        /**
         * Init show attachment label
         */
        initAttachmentLabelS3: function initAttachmentLabelS3() {
            // Return if the config do not allow it
            if (wpmfFoldersModule.aws3_label === false) {
                return;
            }

            wpmfFoldersModule.getFrame().find('.attachments-browser ul.attachments .attachment .thumbnail').each(function (i, v) {
                var $wrap = $(v).closest('.attachment');
                var id = $wrap.data('id');
                var src_img = wp.media.attachment(id).get('url');
                var aws3_infos = wp.media.attachment(id).get('aws3_infos');
                if (typeof src_img !== "undefined") {
                    if (typeof aws3_infos !== "undefined") {
                        if (!$wrap.find('.wpmf_aws_text').length) {
                            var endpoint = 'aws3';
                            if (typeof aws3_infos.endpoint !== "undefined") {
                                endpoint = aws3_infos.endpoint;
                            }
                            var aws_text = 'aws3';
                            switch (endpoint) {
                                case 'wasabi':
                                    aws_text = 'Wasabi';
                                    break;
                                case 'digitalocean':
                                    aws_text = 'DigitalOcean';
                                    break;
                                case 'linode':
                                    aws_text = 'Linode';
                                    break;
                                case 'google_cloud_storage':
                                    aws_text = 'Google Cloud';
                                    break;
                                case 'bunny_cdn_edge':
                                    aws_text = 'BunnyNet';
                                    break;
                            }

                            $wrap.find('.attachment-preview').append('<span data-wpmftippy_id="' + id + '" class="wpmf_aws_text ' + endpoint + '">' + aws_text + '</span>');
                            var aws_text_info = '';
                            aws_text_info += '<p>Bucket: ' + aws3_infos.Bucket + '</p>';
                            aws_text_info += '<p>Path: ' + aws3_infos.Key + '</p>';
                            aws_text_info += '<p>Region: ' + aws3_infos.Region + '</p>';
                            aws_text_info += '<p>Access: ' + aws3_infos.Acl + '</p>';
                            var aws3_tooltip = '<div class="wpmf_aws_text_info" id="tippy_' + id + '">' + aws_text_info + '</div>';
                            $wrap.find('.attachment-preview').append(aws3_tooltip);
                        }
                    }
                }
            });

            tippy('.wpmf_aws_text', {
                theme: 'wpmf',
                animation: 'scale',
                animateFill: false,
                maxWidth: 300,
                duration: 0,
                arrow: true,
                allowHTML: true,
                onShow: function onShow(instance) {
                    var id = $(instance.reference).data('wpmftippy_id');
                    instance.popper.hidden = false;
                    instance.setContent($('#tippy_' + id).html());
                }
            });
        },

        /**
         *  Init hover image
         */
        initHoverImage: function initHoverImage() {
            // Return if the config do not allow it
            if (wpmfFoldersModule.hover_image === false) {
                return;
            }

            if (wp !== undefined && wp.media !== undefined && wp.media.frame !== undefined && wp.media.frame._state === 'gallery-edit') {
                return;
            }

            // todo : rewrite and comment this part
            var yOffset = 30;
            // these 2 variable determine popup's distance from the cursor
            // you might want to adjust to get the right result
            /* END CONFIG */
            wpmfFoldersModule.getFrame().find('.attachments-browser ul.attachments .attachment .thumbnail').on('mouseenter', function (e) {
                var $this = $(this);
                if ($this.closest('.attachment-preview').hasClass('type-image') && !$this.closest('.attachment.loading').length) {
                    var id_img = $(this).closest('.attachment').data('id');
                    var ext = '!svg';
                    if (typeof wpmfFoldersModule.hover_images[id_img] === "undefined") {
                        /* Get some attribute */

                        var sizes = wp.media.attachment(id_img).get('sizes');
                        var title = wp.media.attachment(id_img).get('title');
                        var is_video = wp.media.attachment(id_img).get('is_video');
                        var video_url = wp.media.attachment(id_img).get('video_url');
                        var caption = wp.media.attachment(id_img).get('caption');
                        var filename = wp.media.attachment(id_img).get('filename');
                        var width = 0;
                        if ($this.closest('.attachment-preview').hasClass('subtype-svg+xml')) {
                            var wpmfurl = $this.find('img').attr('src');
                            ext = 'svg';
                            return;
                        } else {
                            if (typeof sizes !== "undefined") {
                                if (typeof sizes.medium !== "undefined" && typeof sizes.medium.url !== "undefined") {
                                    wpmfurl = sizes.medium.url;
                                    if (typeof sizes.medium.width !== "undefined") {
                                        width = sizes.medium.width;
                                    }
                                } else {
                                    wpmfurl = $this.find('img').attr('src');
                                    width = $this.find('img').width();
                                }
                            } else {
                                wpmfurl = $this.find('img').attr('src');
                                width = $this.find('img').width();
                            }
                        }

                        if (typeof title === "undefined") {
                            title = "";
                        }

                        if (typeof filename === "undefined") {
                            filename = "";
                        }
                        title = wpmfescapeScripts(title);
                        wpmfFoldersModule.hover_images[id_img] = {
                            'title': title,
                            'is_video': is_video,
                            'video_url': video_url,
                            'caption': caption,
                            'wpmfurl': wpmfurl,
                            'filename': filename,
                            'width': width,
                            'ext': ext
                        };
                    }
                    var html = "<div id='wpmf_preview_image'>";
                    html += '<div><img src="' + wpmfFoldersModule.hover_images[id_img].wpmfurl + '" width="' + wpmfFoldersModule.hover_images[id_img].width + '" /></div>';
                    html += "<span class='bottomlegend'>";
                    html += "<span class='bottomlegend_filename'>";
                    if (parseInt(wpmfFoldersModule.hover_images[id_img].is_video) === 1) {
                        html += wpmfFoldersModule.hover_images[id_img].title;
                    } else {
                        html += wpmfFoldersModule.hover_images[id_img].filename;
                    }

                    html += "</span>";
                    html += "<br>";
                    html += "<span class='bottomlegend_filetitle'>";
                    if (parseInt(wpmfFoldersModule.hover_images[id_img].is_video) === 1) {
                        if (wpmfFoldersModule.hover_images[id_img].video_url !== '') {
                            html += wpmfFoldersModule.hover_images[id_img].video_url;
                        }
                    } else {
                        html += wpmfFoldersModule.hover_images[id_img].title;
                    }

                    html += "</span>";
                    html += "</span>";
                    html += "</div>";
                    if ($('#wpmf_preview_image').length === 0) {
                        $("body").append(html);
                        $("#wpmf_preview_image").fadeIn("fast");
                        var top;
                        if (e.pageY + $("#wpmf_preview_image").height() > $('body').height()) {
                            top = e.pageY - $("#wpmf_preview_image").height() - 50;
                        } else {
                            top = e.pageY - $("#wpmf_preview_image").height() / 2 - 50;
                        }

                        if (e.pageX + 300 > $('body').width()) {
                            $("#wpmf_preview_image").css("top", top + "px").css("left", e.pageX - 350 + "px").fadeIn("fast");
                        } else {
                            $("#wpmf_preview_image").css("top", top + "px").css("left", e.pageX + yOffset + "px").fadeIn("fast");
                        }
                    }
                }
            }).on('mouseleave', wpmfFoldersModule.getFrame().find('.attachments-browser ul.attachments .attachment .thumbnail'), function () {
                $("#wpmf_preview_image").remove();
            });
        },

        addCreateGalleryBtn: function addCreateGalleryBtn() {
            if (parseInt(wpmf.vars.usegellery) === 1) {
                if ($('.btn-selectall').length === 0) {
                    var btnSelectAll = "<a href='#' class='button media-button button-primary button-large btn-selectall'>" + wpmf.l18n.create_gallery_folder + "</a>";
                    $('.button.media-button.button-primary.button-large.media-button-gallery').before(btnSelectAll);
                }

                if ($('.btn-selectall-gallery').length === 0) {
                    var btnSelectAll1 = "<a href='#' class='button media-button button-primary button-large btn-selectall-gallery'>" + wpmf.l18n.create_gallery_folder + "</a>";
                    $('.button.media-button.button-primary.button-large.media-button-insert').before(btnSelectAll1);
                }
            }
        },

        initRemoteVideo: function initRemoteVideo() {
            // Ajax function which creates the video
            var create_remote_video = function create_remote_video() {
                var remote_link = $('.wpmf_remote_video_input').val();
                $.ajax({
                    type: "POST",
                    url: wpmf.vars.ajaxurl,
                    data: {
                        action: "wpmf",
                        task: "create_remote_video",
                        wpmf_remote_link: remote_link,
                        folder_id: wpmfFoldersModule.last_selected_folder,
                        wpmf_nonce: wpmf.vars.wpmf_nonce
                    },
                    success: function success(response) {
                        if (response.status) {
                            wpmfSnackbarModule.show({
                                id: 'remote_video_uploaded',
                                content: wpmf.l18n.video_uploaded
                            });
                            wpmfFoldersModule.reloadAttachments();
                            wpmfFoldersModule.trigger('addRemoteVideo', wpmfFoldersModule.last_selected_folder);
                        } else {
                            showDialog({
                                title: wpmf.l18n.information,
                                text: response.msg,
                                closeicon: true
                            });
                        }
                    }
                });
            };

            // Initialize main functionality
            if (wpmf.vars.hide_remote_video) {
                $('.wpmf_btn_remote_video,.wpmf_icon_remote_video').on('click', function () {
                    var html = '<div><input type="text" name="wpmf_gallery_video_url" class="wpmf_gallery_video_url" placeholder="' + wpmf.l18n.video_url + '" onfocus="this.placeholder = \'\'" onblur="this.placeholder = wpmf.l18n.video_url"></div>';
                    html += '<div class="add-video-wrap">';
                    html += '<div class="add-video-img-wrap">';
                    html += '<img class="thumb-video" src="' + wpmf.vars.plugin_url_image + 'images-default.png">';
                    html += '<img class="thumb-loading" src="' + wpmf.vars.plugin_url_image + 'spinner.gif">';
                    html += '<input type="hidden" class="video-thumbnail-id">';
                    html += '<i class="material-icons wpmf_gallery_video_icon">play_circle_filled</i>';
                    html += '<div class="video-thumbnail-action">';
                    html += '<span class="material-icons-outlined remove-video-thumbnail"> close </span>';
                    html += '</div>';
                    html += '</div>';
                    html += '<div class="video-thumbnail-btn-wrap"><button class="add-video-thumbnail-btn">' + wpmf.l18n.add_image + '</button></div>';
                    html += '<p class="add_video_msg"></p>';
                    html += '</div>';
                    var folder_id = wpmfFoldersModule.last_selected_folder;
                    showDialog({
                        id: 'wpmf-add-video-dialog',
                        title: wpmf.l18n.add_video,
                        help_icon: '<span class="material-icons-outlined wpmf-video-help"> help_outline </span>',
                        text: html,
                        negative: {
                            title: wpmf.l18n.cancel
                        },
                        positive: {
                            title: wpmf.l18n.create,
                            onClick: function onClick() {
                                // Call php script to create the folder
                                var video_url = $('.wpmf_gallery_video_url').val();
                                var thumbnail_id = $('.video-thumbnail-id').val();
                                if (video_url === '') {
                                    $('.add_video_msg').html(wpmf.l18n.empty_url).fadeIn(1000).delay(4000).fadeOut(200);
                                    return true;
                                }

                                if (video_url.indexOf("facebook") !== -1 || video_url.indexOf("wistia") !== -1 || video_url.indexOf("twitch") !== -1 || video_url.indexOf(wpmf.vars.site_url) !== -1) {
                                    if (thumbnail_id === '') {
                                        $('.add_video_msg').html(wpmf.l18n.empty_thumbnail).fadeIn(1000).delay(4000).fadeOut(200);
                                        return true;
                                    }
                                }

                                wpmfFoldersModule.addVideoToGallery(video_url, thumbnail_id, folder_id);
                            }
                        }
                    });

                    tippy('.wpmf-video-help', {
                        theme: 'wpmf',
                        animation: 'scale',
                        animateFill: false,
                        maxWidth: 400,
                        duration: 0,
                        arrow: true,
                        allowHTML: true,
                        onShow: function onShow(instance) {
                            var tippy_html = '';
                            tippy_html += '<p class="video-tippy-help" style="color: yellow; font-size:14px">Support: youtube, vimeo, kaltura, facebook watch, wistia, twitch, dailymotion, self-hosted</p>';
                            tippy_html += '<p class="video-tippy-help">https://www.youtube.com/watch?v=5ncy4gn6S0k</p>';
                            tippy_html += '<p class="video-tippy-help">https://vimeo.com/496843494</p>';
                            tippy_html += '<p class="video-tippy-help">https://videos.kaltura.com/media/Kaltura+Overview/1_11mvteme</p>';
                            tippy_html += '<p class="video-tippy-help">https://www.facebook.com/svmteam/videos/972235670261003</p>';
                            tippy_html += '<p class="video-tippy-help">https://www.twitch.tv/videos/999290199</p>';
                            tippy_html += '<p class="video-tippy-help">https://www.dailymotion.com/video/x80wibi</p>';
                            tippy_html += '<p class="video-tippy-help">https://xx.wistia.com/medias/uqlavso61q</p>';
                            tippy_html += '<p class="video-tippy-help">https://your-domain.com/video.mp4</p>';
                            instance.popper.hidden = false;
                            instance.setContent(tippy_html);
                        }
                    });

                    $('.wpmf_gallery_video_url').off('change').on('change', function () {
                        var video_url = $(this).val();
                        if (video_url !== '') {
                            $('.add-video-wrap').addClass('show');
                            $.ajax({
                                url: ajaxurl,
                                method: "POST",
                                dataType: 'json',
                                data: {
                                    action: "wpmf",
                                    task: "auto_load_video_thumbnail",
                                    video_url: video_url,
                                    wpmf_nonce: wpmf.vars.wpmf_nonce
                                },
                                beforeSend: function beforeSend() {
                                    $('.add-video-img-wrap').addClass('loading');
                                },
                                success: function success(res) {
                                    $('.add-video-img-wrap').removeClass('loading');
                                    if (res.status) {
                                        $('.add-video-img-wrap .thumb-video').attr('src', res.thumb_url);
                                        $('.add-video-thumbnail-btn').html(wpmf.l18n.change_thumbnail);
                                    } else {
                                        $('.add_video_msg').html(wpmf.l18n.empty_video_thumbnail).fadeIn(1000).delay(4000).fadeOut(200);
                                    }
                                }
                            });
                        } else {
                            $('.add-video-wrap').removeClass('show');
                        }
                    });

                    $('.add-video-thumbnail-btn').off('click').on('click', function () {
                        if (typeof frame !== "undefined") {
                            frame.open();
                            return;
                        }
                        // Create the media frame.
                        var frame = wp.media({
                            // Tell the modal to show only images.
                            library: {
                                type: 'image'
                            }
                        });

                        // When an image is selected, run a callback.
                        frame.on('select', function () {
                            // Grab the selected attachment.
                            var attachment = frame.state().get('selection').first().toJSON();
                            $('.add-video-img-wrap .thumb-video').attr('src', attachment.url);
                            $('.add-video-img-wrap .video-thumbnail-id').val(attachment.id);
                            $('.add-video-thumbnail-btn').html(wpmf.l18n.change_thumbnail);
                        });

                        // let's open up the frame.
                        frame.open();
                    });

                    $('.remove-video-thumbnail').off('click').on('click', function () {
                        $('.add-video-img-wrap .thumb-video').attr('src', wpmf.vars.plugin_url_image + 'images-default.png');
                        $('.add-video-img-wrap .video-thumbnail-id').val('');
                        $('.add-video-thumbnail-btn').html(wpmf.l18n.add_image);
                    });
                });
            }
        },

        addVideoToGallery: function addVideoToGallery() {
            var video_url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
            var thumbnail_id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
            var folder_id = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

            if (video_url === '') {
                return;
            }
            $.ajax({
                url: ajaxurl,
                method: "POST",
                dataType: 'json',
                data: {
                    action: "wpmf",
                    task: "create_remote_video",
                    video_url: video_url,
                    thumbnail_id: thumbnail_id,
                    folder_id: folder_id,
                    wpmf_nonce: wpmf.vars.wpmf_nonce
                },
                beforeSend: function beforeSend() {},
                success: function success(res) {
                    if (res.status) {
                        wpmfFoldersModule.reloadAttachments(true);
                        wpmfFoldersModule.trigger('addRemoteVideo', folder_id);
                    }
                }
            });
        },

        /**
         * Trigger an event
         * @param event string the event name
         * @param arguments
         */
        trigger: function trigger(event) {
            // Retrieve the list of arguments to send to the function
            var args = Array.prototype.slice.call(arguments).slice(1); // Cross browser compatible let args = Array.from(arguments).slice(1);

            // Retrieve registered function
            var events = wpmfFoldersModule.events[event];

            // For each registered function apply arguments
            if (events) {
                for (var i = 0; i < events.length; i++) {
                    events[i].apply(this, args);
                }
            }
        },

        /**
         * Subscribe to an or multiple events
         * @param events {string|array} event name
         * @param subscriber function the callback function
         */
        on: function on(events, subscriber) {
            // If event is a string convert it as an array
            if (typeof events === 'string') {
                events = [events];
            }

            // Allow multiple event to subscript
            for (var ij in events) {
                if (typeof subscriber === 'function') {
                    if (typeof wpmfFoldersModule.events[events[ij]] === "undefined") {
                        this.events[events[ij]] = [];
                    }
                    wpmfFoldersModule.events[events[ij]].push(subscriber);
                }
            }
        }
    };

    cloud_sync_loader_icon = '<span title="' + wpmf.l18n.hover_cloud_syncing + '" class="wpmf-loading-sync"><svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" class="lds-dual-ring" style="\n    height: 20px;\n    width: 20px;\n    vertical-align: sub !important;\n"><circle cx="50" cy="50" ng-attr-r="{{config.radius}}" ng-attr-stroke-width="{{config.width}}" ng-attr-stroke="{{config.stroke}}" ng-attr-stroke-dasharray="{{config.dasharray}}" fill="none" stroke-linecap="round" r="40" stroke-width="12" stroke="#2196f3" stroke-dasharray="62.83185307179586 62.83185307179586" transform="rotate(53.6184 50 50)"><animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;360 50 50" keyTimes="0;1" dur="1s" begin="0s" repeatCount="indefinite"></animateTransform></circle></svg></span>';
    wpmfAddCloudQueue = {
        /**
         * Sync the folders from Dropbox to Media library
         */
        addDropboxQueue: function addDropboxQueue() {
            $.ajax({
                method: "POST",
                dataType: "json",
                url: ajaxurl,
                data: {
                    action: 'wpmf_dropbox_add_queue',
                    wpmf_nonce: wpmf.vars.wpmf_nonce
                },
                beforeSend: function beforeSend() {
                    wpmfSnackbarModule.show({
                        id: 'sync_drive',
                        content: wpmf.l18n.syncing_with_cloud,
                        icon: '<span class="material-icons-outlined wpmf-snack-icon wpmf-snack-loader">sync</span>',
                        auto_close: false,
                        is_progress: true
                    });
                    if (!$('.dropbox_list .wpmf-loading-sync').length) {
                        $('.dropbox_list > .wpmf-item .wpmf-item-title').append(cloud_sync_loader_icon);
                    }
                },
                success: function success(response) {
                    wpmfSnackbarModule.close('sync_drive');
                    $('.dropbox_list .wpmf-loading-sync').remove();
                    wpmfSnackbarModule.show({
                        id: 'queue_alert',
                        content: wpmf.l18n.queue_sync_alert,
                        auto_close: true,
                        is_progress: true
                    });
                },
                error: function error() {
                    wpmfAddCloudQueue.addDropboxQueue();
                }
            });
        },

        /**
         * Sync the folders from Google Drive to Media library
         */
        addGoogleQueue: function addGoogleQueue() {
            var folder_id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

            $.ajax({
                method: "POST",
                dataType: "json",
                url: ajaxurl,
                data: {
                    action: 'wpmf_google_add_queue',
                    folder_id: folder_id,
                    wpmf_nonce: wpmf.vars.wpmf_nonce
                },
                beforeSend: function beforeSend() {
                    wpmfSnackbarModule.show({
                        id: 'sync_drive',
                        content: wpmf.l18n.syncing_with_cloud,
                        icon: '<span class="material-icons-outlined wpmf-snack-icon wpmf-snack-loader">sync</span>',
                        auto_close: false,
                        is_progress: true
                    });
                    if (!$('.google_drive_list .wpmf-loading-sync').length) {
                        $('.google_drive_list > .wpmf-item .wpmf-item-title').append(cloud_sync_loader_icon);
                    }
                },
                success: function success(response) {
                    wpmfSnackbarModule.close('sync_drive');
                    $('.google_drive_list .wpmf-loading-sync').remove();
                    wpmfSnackbarModule.show({
                        id: 'queue_alert',
                        content: wpmf.l18n.queue_sync_alert,
                        auto_close: true,
                        is_progress: true
                    });
                },
                error: function error() {
                    wpmfAddCloudQueue.addGoogleQueue();
                }
            });
        },

        addNextcloudQueue: function addNextcloudQueue() {
            $.ajax({
                method: "POST",
                dataType: "json",
                url: ajaxurl,
                data: {
                    action: 'wpmf_nextcloud_add_queue',
                    wpmf_nonce: wpmf.vars.wpmf_nonce
                },
                beforeSend: function beforeSend() {
                    wpmfSnackbarModule.show({
                        id: 'sync_drive',
                        content: wpmf.l18n.syncing_with_cloud,
                        icon: '<span class="material-icons-outlined wpmf-snack-icon wpmf-snack-loader">sync</span>',
                        auto_close: false,
                        is_progress: true
                    });
                    if (!$('.nextcloud_list .wpmf-loading-sync').length) {
                        $('.nextcloud_list > .wpmf-item .wpmf-item-title').append(cloud_sync_loader_icon);
                    }
                },
                success: function success(response) {
                    wpmfSnackbarModule.close('sync_drive');
                    $('.nextcloud_list .wpmf-loading-sync').remove();
                    wpmfSnackbarModule.show({
                        id: 'queue_alert',
                        content: wpmf.l18n.queue_sync_alert,
                        auto_close: true,
                        is_progress: true
                    });
                },
                error: function error() {
                    wpmfAddCloudQueue.addNextcloudQueue();
                }
            });
        },

        /**
         * Sync the folders from OneDrive to Media library
         */
        addOnedriveQueue: function addOnedriveQueue() {
            $.ajax({
                method: "POST",
                dataType: "json",
                url: ajaxurl,
                data: {
                    action: 'wpmf_onedrive_add_queue',
                    wpmf_nonce: wpmf.vars.wpmf_nonce
                },
                beforeSend: function beforeSend() {
                    wpmfSnackbarModule.show({
                        id: 'sync_drive',
                        content: wpmf.l18n.syncing_with_cloud,
                        icon: '<span class="material-icons-outlined wpmf-snack-icon wpmf-snack-loader">sync</span>',
                        auto_close: false,
                        is_progress: true
                    });
                    if (!$('.onedrive_list .wpmf-loading-sync').length) {
                        $('.onedrive_list > .wpmf-item .wpmf-item-title').append(cloud_sync_loader_icon);
                    }
                },
                success: function success(response) {
                    wpmfSnackbarModule.close('sync_drive');
                    $('.onedrive_list .wpmf-loading-sync').remove();
                    wpmfSnackbarModule.show({
                        id: 'queue_alert',
                        content: wpmf.l18n.queue_sync_alert,
                        auto_close: true,
                        is_progress: true
                    });
                },
                error: function error() {
                    wpmfAddCloudQueue.addOnedriveQueue();
                }
            });
        },

        /**
         * Sync the folders from OneDrive Business to Media library
         */
        addOnedriveBusinessQueue: function addOnedriveBusinessQueue() {
            $.ajax({
                method: "POST",
                dataType: "json",
                url: ajaxurl,
                data: {
                    action: 'wpmf_odvbs_add_queue',
                    wpmf_nonce: wpmf.vars.wpmf_nonce
                },
                beforeSend: function beforeSend() {
                    wpmfSnackbarModule.show({
                        id: 'sync_drive',
                        content: wpmf.l18n.syncing_with_cloud,
                        icon: '<span class="material-icons-outlined wpmf-snack-icon wpmf-snack-loader">sync</span>',
                        auto_close: false,
                        is_progress: true
                    });
                    if (!$('.onedrive_business_list .wpmf-loading-sync').length) {
                        $('.onedrive_business_list > .wpmf-item .wpmf-item-title').append(cloud_sync_loader_icon);
                    }
                },
                success: function success(response) {
                    wpmfSnackbarModule.close('sync_drive');
                    $('.onedrive_business_list .wpmf-loading-sync').remove();
                    wpmfSnackbarModule.show({
                        id: 'queue_alert',
                        content: wpmf.l18n.queue_sync_alert,
                        auto_close: true,
                        is_progress: true
                    });
                },
                error: function error() {
                    wpmfAddCloudQueue.addOnedriveBusinessQueue();
                }
            });
        }
    };

    // add filter work with Easing Slider plugin
    if (wpmf.vars.base === 'toplevel_page_easingslider') {
        wpmfFoldersModule.initFolderFilter();
    }

    // Let's initialize WPMF features
    $(document).ready(function () {
        wpmfFoldersModule.initModule();
    });
})(jQuery);

/**
 * Escape string
 * @param s string
 */
var wpmfescapeScripts = function wpmfescapeScripts(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

/**
 * ECMAScript 5 repeat function
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/repeat
 */
if (!String.prototype.repeat) {
    String.prototype.repeat = function (count) {
        'use strict';

        if (this == null) {
            throw new TypeError('can\'t convert ' + this + ' to object');
        }
        var str = '' + this;
        count = +count;
        if (count != count) {
            count = 0;
        }
        if (count < 0) {
            throw new RangeError('repeat count must be non-negative');
        }
        if (count == Infinity) {
            throw new RangeError('repeat count must be less than infinity');
        }
        count = Math.floor(count);
        if (str.length == 0 || count == 0) {
            return '';
        }
        // Ensuring count is a 31-bit integer allows us to heavily optimize the
        // main part. But anyway, most current (August 2014) browsers can't handle
        // strings 1 << 28 chars or longer, so:
        if (str.length * count >= 1 << 28) {
            throw new RangeError('repeat count must not overflow maximum string size');
        }
        var rpt = '';
        for (var i = 0; i < count; i++) {
            rpt += str;
        }
        return rpt;
    };
}

if (!Object.values) {
    Object.values = function objectValues(obj) {
        var res = [];
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                res.push(obj[i]);
            }
        }
        return res;
    };
}
