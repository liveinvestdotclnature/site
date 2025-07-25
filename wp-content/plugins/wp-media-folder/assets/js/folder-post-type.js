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
        categories: null, // All categories objects
        relation_category_filter: [], // Relation between categories variable and filter select
        last_selected_folder: 0, // Last folder we moved into
        dragging_elements: null, // Variable used to store elements while dragging files or folders
        doing_global_search: false, // Save status of search
        page_type: null, // Current page type upload-list, upload-grid
        editFolderId: 0, // Current folder id to edit or delete ...
        editFileId: 0, // Current file id to edit
        folder_search: null,
        events: [], // event handling
        limit_folders: 400,
        enable_folders: true,
        folders_order: 'custom',

        /**
         * Retrieve the current displayed frame
         */
        getFrame: function getFrame() {
            return $('.edit-php .wpmf-folder-post-type');
        },

        /**
         * Initialize module related things
         */
        initModule: function initModule() {
            // Retrieve values we'll use
            wpmfFoldersModule.limit_folders = parseInt(wpmf.vars.limit_folders_number);
            wpmfFoldersModule.categories = wpmf.vars.wpmf_categories;
            wpmfFoldersModule.taxonomy = wpmf.vars.taxo;
            wpmfFoldersModule.post_type = wpmf.vars.post_type;

            var init = function init() {
                var $current_frame = wpmfFoldersModule.getFrame();
                // get last access folder
                var lastAccessFolder = wpmfFoldersModule.getCookie('lastAccessFolder_' + wpmf.vars.host);
                if (typeof lastAccessFolder !== "undefined") {
                    wpmfFoldersModule.last_selected_folder = lastAccessFolder;
                }
                // render context menu box
                wpmfFoldersModule.renderContextMenu();

                // render folder permissions wrap
                wpmfFoldersModule.renderFolderPermissionsWrap();

                // open / close context menu box
                wpmfFoldersModule.openContextMenuFolder();

                wpmfFoldersModule.trigger('ready', $current_frame);
            };

            init();
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
            var context_folder = '<ul class="wpmf-contextmenu wpmf-contextmenu-folder contextmenu z-depth-1 grey-text text-darken-2">\n                <li><div class="material_newfolder items_menu">' + wpmf.l18n.new_folder + '<span class="material-icons-outlined wpmf_icon"> create_new_folder </span></div></li>\n                <li><div class="material_refreshfolder items_menu">' + wpmf.l18n.refresh + '<span class="material-icons-outlined wpmf_icon"> refresh </span></div></li>\n                <li><div class="material_editfolder items_menu">' + wpmf.l18n.edit_folder + '<span class="material-icons-outlined wpmf_icon"> edit </span></div></li>\n                <li><div class="material_deletefolder items_menu">' + wpmf.l18n.delete + '<span class="material-icons-outlined wpmf_icon"> delete_outline </span></div></li>\n                <li><div class="wpmf-bulk-folders-btn items_menu">' + wpmf.l18n.bulk_select + '<span class="material-icons-outlined wpmf_icon"> checklist </span></div></li>\n            ';
            context_folder += '<li class="sub folder-color">\n                <div class="items_menu">\n                    <span class="material-icons-outlined wpmf_icon"> format_paint </span>\n                    ' + wpmf.l18n.change_color + '            \n                    <div class="waves waves-effect"></div>\n                <span class="wpmf_changecolor_icon wpmf_icon"></span>\n                <i class="material-icons right">keyboard_arrow_right</i>\n                </div>\n                <ul class="colorsub submenu z-depth-1">\n                    <li class="waves-effect wpmf-color-picker">\n                            <div class="color-wrapper">\n                            ' + colors + '\n                            </div>\n                    </li>\n                </ul>\n            </li>';
            if (wpmf.vars.enable_permissions_settings) {
                context_folder += '<li><a class="open_folder_permissions items_menu" href="#folder_permissions">' + wpmf.l18n.permissions_setting + '<span class="material-icons-outlined wpmf_icon"> settings </span></a></li>';
            }
            context_folder += '</ul>';

            // Add the context menu box for folder to body
            if (!$('.wpmf-contextmenu.wpmf-contextmenu-folder').length) {
                $('body').append(context_folder);
            }
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
                } else if (parseInt($(e.target).data('id')) === -1 || $(e.target).closest('li').data('id') === -1) {
                    $('.wpmf-contextmenu-folder li').hide();
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

                    if (parseInt($(e.target).data('id')) === -1 || $(e.target).closest('li').data('id') === -1) {
                        $('.material_refreshfolder').closest('li').show();
                    }

                    if (wpmf.vars.show_folder_id) {
                        $('.wpmf_folderID').html(wpmfFoldersModule.editFolderId);
                    }

                    // render custom color
                    wpmfFoldersModule.renderCustomColor();
                    // change color for folder
                    wpmfFoldersModule.setFolderColor();
                    // Set status folder color
                    // wpmfFoldersModule.appendCheckColor();
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
                wpmfFoldersModule.reloadFolder();
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
         * Set status folder color
         */
        appendCheckColor: function appendCheckColor() {
            $('.color-wrapper .color .color_check:not(.custom_color .color_check)').remove();
            $('.color-wrapper > .color[data-color="' + wpmf.vars.colors[wpmfFoldersModule.editFolderId] + '"]').append('<i class="material-icons color_check">done</i>');
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
                    custom_color = '#8f8f8f';
                } else {
                    custom_color = wpmf.vars.colors[wpmfFoldersModule.editFolderId];
                    value = wpmf.vars.colors[wpmfFoldersModule.editFolderId];
                }
            } else {
                custom_color = '#8f8f8f';
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
                        action: "wpmf_folder_post_type",
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
                    action: "wpmf_folder_post_type",
                    task: "add_folder",
                    name: name,
                    parent: parent_id,
                    folder_post_type_name: wpmfFoldersModule.taxonomy,
                    post_type: wpmfFoldersModule.post_type,
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
                        // Update the categories variables
                        wpmfFoldersModule.categories = response.categories;

                        // Regenerate the folder filter
                        // wpmfFoldersModule.initFolderFilter();

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
                    action: "wpmf_folder_post_type",
                    task: "edit_folder",
                    name: name,
                    id: id,
                    folder_post_type_name: wpmfFoldersModule.taxonomy,
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
                    action: "wpmf_folder_post_type",
                    task: "delete_folder",
                    id: id,
                    folder_post_type_name: wpmfFoldersModule.taxonomy,
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
                        // Update the categories variables
                        wpmfFoldersModule.categories = response.categories;
                        wpmfSnackbarModule.close('deleting_folder');
                        // Show snackbar
                        wpmfSnackbarModule.show({
                            id: 'undo_remove_folder',
                            content: wpmf.l18n.wpmf_undo_remove,
                            icon: '<span class="material-icons-outlined wpmf-snack-icon">delete_outline</span>',
                        });

                        wpmfFoldersModule.last_selected_folder = 0;

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
                        action: "wpmf_folder_post_type",
                        task: "delete_multiple_folders",
                        id: ids.join(),
                        folder_post_type_name: wpmfFoldersModule.taxonomy,
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
                            // Update the categories variables
                            wpmfFoldersModule.categories = response.categories;
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
                    // wpmfFoldersModule.changeFolder(0);
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

            folders_ordered = wpmfFoldersModule.categories;

            var folder_order = wpmfFoldersModule.folder_order;
            if (typeof folder_order !== "undefined") {
                wpmfFoldersModule.folder_ordering = folder_order;
            } else {
                wpmfFoldersModule.folder_ordering = 'name-ASC';
            }

            // Order folders
            switch (wpmfFoldersModule.folder_ordering) {
                default:
                case 'name-ASC':
                    folders_ordered = Object.values(folders_ordered).sort(function (a, b) {
                        return a.label.localeCompare(b.label);
                    });
                    break;
                case 'name-DESC':
                    folders_ordered = Object.values(folders_ordered).sort(function (a, b) {
                        return b.label.localeCompare(a.label);
                    });
                    break;
                case 'id-ASC':
                    folders_ordered = Object.values(folders_ordered).sort(function (a, b) {
                        return a.id - b.id;
                    });
                    break;
                case 'id-DESC':
                    folders_ordered = Object.values(folders_ordered).sort(function (a, b) {
                        return b.id - a.id;
                    });
                    break;
                case 'custom':
                    folders_ordered = Object.values(folders_ordered).sort(function (a, b) {
                        return a.order - b.order;
                    });
                    break;
            }

            // Add each folder to the attachments listing
            $(folders_ordered).each(function () {
                // Get the formatted folder for the attachment listing
                if (parseInt(this.parent_id) !== 0) {
                    var folder = wpmfFoldersModule.getFolderRendering('folder', this.label, this.id, this.parent_id);
                    // Add the folder to the attachment listing
                    $attachments_container.append(folder);
                }
            });

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
                wpmfFoldersModule.last_selected_folder = 0;
            } else {
                wpmfFoldersModule.setCookie('lastAccessFolder_' + wpmf.vars.host, term_id, 365);
                wpmfFoldersModule.last_selected_folder = term_id;
            }

            if (typeof wpmfFoldersModule.categories[term_id].getTermAdminLink !== "undefined") {
                var ajaxURL = wpmfFoldersModule.categories[term_id].getTermAdminLink;
                $("#wpbody").load(ajaxURL + " #wpbody-content", false, function (res) {
                    var obj = { Title: "", Url: ajaxURL };
                    history.pushState(obj, obj.Title, obj.Url);

                    wpmfFoldersTreeModule.initModule(wpmfFoldersModule.getFrame());
                    wpmfFoldersModule.reloadEventWP();
                })
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
                    action: "wpmf_folder_post_type",
                    task: "move_folder",
                    id: folder_id,
                    id_category: folder_to_id,
                    folder_post_type_name: wpmfFoldersModule.taxonomy,
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
         * Force attachments to be reloaded in the current view
         */
        reloadFolder: function reloadFolder() {
            $.ajax({
                type: "POST",
                url: wpmf.vars.ajaxurl,
                data: {
                    action: "wpmf_folder_post_type",
                    task: "reload_folder_tree",
                    folder_post_type_name: wpmfFoldersModule.taxonomy,
                    wpmf_nonce: wpmf.vars.wpmf_nonce
                },
                success: function success(response) {
                    if (response.status) {
                        wpmfFoldersModule.categories = response.categories;
                        wpmfFoldersModule.last_selected_folder = wpmfFoldersModule.getCookie('lastAccessFolder_' + wpmf.vars.host);

                        var ajaxURL = wpmf.vars.current_url;
                        var lastAccessFolder = wpmfFoldersModule.getCookie('lastAccessFolder_' + wpmf.vars.host);
                        if (typeof wpmfFoldersModule.categories[lastAccessFolder] !== 'undefined') {
                            var folderName = wpmfFoldersModule.categories[lastAccessFolder].slug;
                            var urlParams = new URLSearchParams(window.location.search);
                            if (typeof urlParams.get(wpmfFoldersModule.taxonomy) !== 'undefined' && (urlParams.get(wpmfFoldersModule.taxonomy) === '' || urlParams.get(wpmfFoldersModule.taxonomy) === null )) {
                                ajaxURL += folderName;
                            } else {
                                ajaxURL = wpmfFoldersModule.categories[lastAccessFolder].getTermAdminLink;
                            }

                            if (wpmf.vars.lastAccessFolder !== lastAccessFolder) {
                                ajaxURL = wpmfFoldersModule.categories[lastAccessFolder].getTermAdminLink;
                            }
                        } else {
                            wpmfFoldersModule.setCookie('lastAccessFolder_' + wpmf.vars.host, 0, 365);
                        }
                        $("#wpbody").load(ajaxURL + " #wpbody-content", false, function (res) {
                            var obj = { Title: "", Url: ajaxURL };
                            history.pushState(obj, obj.Title, obj.Url);

                            wpmfFoldersTreeModule.initModule(wpmfFoldersModule.getFrame());
                            wpmfFoldersModule.reloadEventWP();
                        })
                    }
                }
            });
        },

        renderPermissionHtml: function renderPermissionHtml(role_user_list) {
            var cl = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'folder_permission_items';

            return '<div class="folder_permission_items_wrap"><div class="' + cl + '" data-role="{{wpmf_role}}">\n                    ' + role_user_list + '\n                    <div class="ju-settings-option folder_permission_item">\n                        <div class="wpmf_row_full">\n                            <label class="ju-setting-label text">' + wpmf.l18n.view_folder + '</label>\n                            <div class="ju-switch-button">\n                                <label class="switch">\n                                    <input type="checkbox" checked class="permission_item_checkbox" value="view_folder">\n                                    <span class="slider round"></span>\n                                </label>\n                            </div>\n                        </div>\n                    </div>\n                    \n                    <div class="ju-settings-option folder_permission_item">\n                        <div class="wpmf_row_full">\n                            <label class="ju-setting-label text">' + wpmf.l18n.add_folder + '</label>\n                            <div class="ju-switch-button">\n                                <label class="switch">\n                                    <input type="checkbox" checked class="permission_item_checkbox" value="add_folder">\n                                    <span class="slider round"></span>\n                                </label>\n                            </div>\n                        </div>\n                    </div>\n                    \n                    <div class="ju-settings-option folder_permission_item">\n                        <div class="wpmf_row_full">\n                            <label class="ju-setting-label text">' + wpmf.l18n.update_folder + '</label>\n                            <div class="ju-switch-button">\n                                <label class="switch">\n                                    <input type="checkbox" checked class="permission_item_checkbox" value="update_folder">\n                                    <span class="slider round"></span>\n                                </label>\n                            </div>\n                        </div>\n                    </div>\n                    \n                    <div class="ju-settings-option folder_permission_item">\n                        <div class="wpmf_row_full">\n                            <label class="ju-setting-label text">' + wpmf.l18n.remove_folder + '</label>\n                            <div class="ju-switch-button">\n                                <label class="switch">\n                                    <input type="checkbox" checked class="permission_item_checkbox" value="remove_folder">\n                                    <span class="slider round"></span>\n                                </label>\n                            </div>\n                        </div>\n                    </div>\n                           \n                                    </div></div>';
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
                                    action: "wpmf_folder_post_type",
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
                            action: "wpmf_folder_post_type",
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
         * click outside
         */
        houtside: function houtside() {
            $('.wpmf-contextmenu-file, .wpmf-contextmenu-folder').hide();
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
        },

        reloadEventWP: function reloadEventWP() {
            if (typeof screenMeta == 'object') {
                screenMeta.init();
                $(document).off("click", "#screen-meta-links .show-settings").on("click", "#screen-meta-links .show-settings", function() {
                    var panel = $( '#' + $( this ).attr( 'aria-controls' ) );
                    if ( !panel.length )
                        return;

                    if (panel.hasClass('hidden')) {
                        screenMeta.open( panel, $(this) );
                    } else {
                        screenMeta.close( panel, $(this) );
                    }   
                });
            }

            if (typeof columns == 'object') {
                columns.init();
                $(document).off("click", "#adv-settings .hide-column-tog").on("click", "#adv-settings .hide-column-tog", function() {
                    var $t = $(this), column = $t.val();
                    if ( $t.prop('checked') )
                        columns.checked(column);
                    else
                        columns.unchecked(column);

                    columns.saveManageColumnsState();
                });
            }

            if(typeof inlineEditPost == "object") {
                inlineEditPost.init();
                $(document).on("click","#the-list .editinline",function(){
                    $(this).attr("aria-expanded","true");
                    inlineEditPost.edit(this);
                });
                $(document).on("click", ".inline-edit-save .save", function(e){
                    e.preventDefault();
                    var thisID = $(this).closest("tr").attr("id");
                    thisID = thisID.replace("edit-","");
                    thisID = thisID.replace("post-","");
                    inlineEditPost.save(thisID);

                    setTimeout(function() {
                        wpmfFoldersModule.reloadFolder();
                    }, 1000);
                });
                $(document).on("click", ".inline-edit-save .cancel", function(){
                    var thisID = $(this).closest("tr").attr("id");
                    thisID = thisID.replace("edit-","");
                    thisID = thisID.replace("post-","");
                    inlineEditPost.revert(thisID);
                });

                wpmfFoldersModule.checkInlineEditWooC();
            }
        },

        checkInlineEditWooC: function checkInlineEditWooC() {
            if(wpmf.vars.post_type != 'product' || typeof woocommerce_quick_edit != "object") {
                return;
            }

            $(document).on('click', '#the-list .editinline', function() {
                var post_id = $(this).closest('tr').attr('id');
                    post_id = post_id.replace('post-', '');

                var $wwop_inline_data = jQuery( '#wholesale_prices_inline_' + post_id ),
                    $base_currency = $wwop_inline_data.find( ".product_base_currency" );

                $wwop_inline_data.find( ".whole_price" ).each(function(index) {
                    if ( $base_currency.length > 0 ) {
                        if ( jQuery( this ).attr( 'data-currencyCode' ) == $base_currency.text() ) {
                            var $wholesale_price_field = jQuery( 'input[name="' + jQuery( this ).attr( 'data-wholesalePriceKeyWithCurrency' ) + '"]' , '.inline-edit-row' );
                            // meaning we already modified the name, so we use the name with no currency instead
                            if ( $wholesale_price_field.length <= 0 ) {
                                $wholesale_price_field = jQuery( 'input[name="' + jQuery( this ).attr( 'id' ) + '"]' , '.inline-edit-row' );
                            }
                            $wholesale_price_field.val( jQuery( this ).text() );
                            $wholesale_price_field.attr( 'placeholder' , '' );
                            $wholesale_price_field.siblings( '.title' ).html( $wholesale_price_field.siblings( '.title' ).html() + ' <em><b>Base Currency</b></em>' );
                            $wholesale_price_field.attr( "name" , jQuery( this ).attr( 'id' ) );

                            var $parent_section_container = $wholesale_price_field.closest( ".section-container" );
                            $wholesale_price_field.closest( "label" ).detach().prependTo( $parent_section_container );
                        } else {
                            jQuery( 'input[name="' + jQuery( this ).attr( 'id' ) + '"]' , '.inline-edit-row' ).val( jQuery( this ).text() );
                        }
                    } else {
                        jQuery( 'input[name="' + jQuery( this ).attr( 'id' ) + '"]' , '.inline-edit-row' ).val( jQuery( this ).text() );
                    }
                });

                var $wc_inline_data = $( '#woocommerce_inline_' + post_id );

                var sku        = $wc_inline_data.find( '.sku' ).text(),
                    regular_price  = $wc_inline_data.find( '.regular_price' ).text(),
                    sale_price     = $wc_inline_data.find( '.sale_price ' ).text(),
                    weight         = $wc_inline_data.find( '.weight' ).text(),
                    length         = $wc_inline_data.find( '.length' ).text(),
                    width          = $wc_inline_data.find( '.width' ).text(),
                    height         = $wc_inline_data.find( '.height' ).text(),
                    shipping_class = $wc_inline_data.find( '.shipping_class' ).text(),
                    visibility     = $wc_inline_data.find( '.visibility' ).text(),
                    stock_status   = $wc_inline_data.find( '.stock_status' ).text(),
                    stock          = $wc_inline_data.find( '.stock' ).text(),
                    featured       = $wc_inline_data.find( '.featured' ).text(),
                    manage_stock   = $wc_inline_data.find( '.manage_stock' ).text(),
                    menu_order     = $wc_inline_data.find( '.menu_order' ).text(),
                    tax_status     = $wc_inline_data.find( '.tax_status' ).text(),
                    tax_class      = $wc_inline_data.find( '.tax_class' ).text(),
                    backorders     = $wc_inline_data.find( '.backorders' ).text(),
                    product_type   = $wc_inline_data.find( '.product_type' ).text();
                    console.log(backorders);
                var formatted_regular_price = regular_price.replace( '.', woocommerce_admin.mon_decimal_point ),
                    formatted_sale_price        = sale_price.replace( '.', woocommerce_admin.mon_decimal_point );

                $( 'input[name="_sku"]', '.inline-edit-row' ).val( sku );
                $( 'input[name="_regular_price"]', '.inline-edit-row' ).val( formatted_regular_price );
                $( 'input[name="_sale_price"]', '.inline-edit-row' ).val( formatted_sale_price );
                $( 'input[name="_weight"]', '.inline-edit-row' ).val( weight );
                $( 'input[name="_length"]', '.inline-edit-row' ).val( length );
                $( 'input[name="_width"]', '.inline-edit-row' ).val( width );
                $( 'input[name="_height"]', '.inline-edit-row' ).val( height );

                $( 'select[name="_shipping_class"] option:selected', '.inline-edit-row' ).attr( 'selected', false ).trigger( 'change' );
                $( 'select[name="_shipping_class"] option[value="' + shipping_class + '"]' ).attr( 'selected', 'selected' )
                    .trigger( 'change' );

                $( 'input[name="_stock"]', '.inline-edit-row' ).val( stock );
                $( 'input[name="menu_order"]', '.inline-edit-row' ).val( menu_order );

                $(
                    'select[name="_tax_status"] option, ' +
                    'select[name="_tax_class"] option, ' +
                    'select[name="_visibility"] option, ' +
                    'select[name="_stock_status"] option, ' +
                    'select[name="_backorders"] option'
                ).prop( 'selected', false ).removeAttr( 'selected' );

                var is_variable_product = 'variable' === product_type;
                $( 'select[name="_stock_status"] ~ .wc-quick-edit-warning', '.inline-edit-row' ).toggle( is_variable_product );
                $( 'select[name="_stock_status"] option[value="' + (is_variable_product ? '' : stock_status) + '"]', '.inline-edit-row' )
                    .attr( 'selected', 'selected' );

                $( 'select[name="_tax_status"] option[value="' + tax_status + '"]', '.inline-edit-row' ).attr( 'selected', 'selected' );
                $( 'select[name="_tax_class"] option[value="' + tax_class + '"]', '.inline-edit-row' ).attr( 'selected', 'selected' );
                $( 'select[name="_visibility"] option[value="' + visibility + '"]', '.inline-edit-row' ).attr( 'selected', 'selected' );
                $( 'select[name="_backorders"] option[value="' + backorders + '"]', '.inline-edit-row' ).attr( 'selected', 'selected' );

                if ( 'yes' === featured ) {
                    $( 'input[name="_featured"]', '.inline-edit-row' ).prop( 'checked', true );
                } else {
                    $( 'input[name="_featured"]', '.inline-edit-row' ).prop( 'checked', false );
                }

                // Conditional display.
                var product_is_virtual = $wc_inline_data.find( '.product_is_virtual' ).text();

                var product_supports_stock_status = 'external' !== product_type;
                var product_supports_stock_fields = 'external' !== product_type && 'grouped' !== product_type;

                $( '.stock_fields, .manage_stock_field, .stock_status_field, .backorder_field' ).show();

                if ( product_supports_stock_fields ) {
                    if ( 'yes' === manage_stock ) {
                        $( '.stock_qty_field, .backorder_field', '.inline-edit-row' ).show().removeAttr( 'style' );
                        $( '.stock_status_field' ).hide();
                        $( '.manage_stock_field input' ).prop( 'checked', true );
                    } else {
                        $( '.stock_qty_field, .backorder_field', '.inline-edit-row' ).hide();
                        $( '.stock_status_field' ).show().removeAttr( 'style' );
                        $( '.manage_stock_field input' ).prop( 'checked', false );
                    }
                } else if ( product_supports_stock_status ) {
                    $( '.stock_fields, .manage_stock_field, .backorder_field' ).hide();
                } else {
                    $( '.stock_fields, .manage_stock_field, .stock_status_field, .backorder_field' ).hide();
                }

                if ( 'simple' === product_type || 'external' === product_type ) {
                    $( '.price_fields', '.inline-edit-row' ).show().removeAttr( 'style' );
                } else {
                    $( '.price_fields', '.inline-edit-row' ).hide();
                }

                if ( 'yes' === product_is_virtual ) {
                    $( '.dimension_fields', '.inline-edit-row' ).hide();
                } else {
                    $( '.dimension_fields', '.inline-edit-row' ).show().removeAttr( 'style' );
                }

                // Rename core strings.
                $( 'input[name="comment_status"]' ).parent().find( '.checkbox-title' ).text( woocommerce_quick_edit.strings.allow_reviews );
            });

            $(document).on('change', '#the-list .inline-edit-row input[name="_manage_stock"]', function() {
                if ( $( this ).is( ':checked' ) ) {
                    $( '.stock_qty_field, .backorder_field', '.inline-edit-row' ).show().removeAttr( 'style' );
                    $( '.stock_status_field' ).hide();
                } else {
                    $( '.stock_qty_field, .backorder_field', '.inline-edit-row' ).hide();
                    $( '.stock_status_field' ).show().removeAttr( 'style' );
                }
            });
        } 
    }

    // Let's initialize WPMF features
    $(document).ready(function () {
        wpmfFoldersModule.initModule();
    });
})(jQuery);