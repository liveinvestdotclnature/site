'use strict';

/**
 * Folder tree for WP Media Folder
 */
var wpmfFoldersTreeModule = void 0;
(function ($) {
    wpmfFoldersTreeModule = {
        categories: [], // categories
        folders_states: [], // Contains open or closed status of folders
        cloudInterval: false,
        folder_tree_status: '',

        /**
         * Retrieve the Jquery tree view element
         * of the current frame
         * @return jQuery
         */
        getTreeElement: function getTreeElement() {
            return $('body').find('.wpmf-main-tree').first();
        },

        /**
         * Initialize module related things
         */
        initModule: function initModule($current_frame) {
            // Import categories from wpmf main module
            wpmfFoldersTreeModule.importCategories();

            var $menu = $current_frame.find('.media-frame-menu .media-menu');
            if (!$menu.length) {
                $menu = $current_frame.find('.media-frame-menu');
                $current_frame.find('.media-frame-menu-heading').hide();
            }
            if (!$menu.find('.wpmf-main-tree').length) {
                $('<div class="wpmf-main-tree"></div>').appendTo($menu);
            }
            // Render the tree view
            wpmfFoldersTreeModule.loadTreeView();

            // Subscribe to the add folder event in main wpmf module
            wpmfFoldersModule.on(['addFolder', 'deleteFolder', 'updateFolder', 'foldersSelection', 'loadmoreFolder'], function (folder) {
                wpmfFoldersTreeModule.importCategories();
                wpmfFoldersTreeModule.loadTreeView();

                var ajaxURL = wpmf.vars.current_url;
                var lastAccessFolder = wpmfFoldersModule.getCookie('lastAccessFolder_' + wpmf.vars.host);
                if (typeof wpmfFoldersModule.categories[lastAccessFolder] !== 'undefined') {
                    var folderName = wpmfFoldersModule.categories[lastAccessFolder].slug;
                    var urlParams = new URLSearchParams(window.location.search);
                    if (typeof urlParams.get(wpmfFoldersModule.taxonomy) !== 'undefined' && (urlParams.get(wpmfFoldersModule.taxonomy) === '' || urlParams.get(wpmfFoldersModule.taxonomy) === null )) {
                        ajaxURL += folderName;
                    }
                } else {
                    wpmfFoldersModule.setCookie('lastAccessFolder_' + wpmf.vars.host, 0, 365);
                }
                $("#wpbody").load(ajaxURL + " #wpbody-content", false, function (res) {
                    var obj = { Title: "", Url: ajaxURL };
                    history.pushState(obj, obj.Title, obj.Url);

                    wpmfFoldersTreeModule.initModule(wpmfFoldersModule.getFrame());
                })
                // Initialize folder tree resizing
                wpmfFoldersTreeModule.initContainerResizing($current_frame);
            });
            wpmfFoldersModule.on(['moveFolder'], function (folder) {
                wpmfFoldersTreeModule.importCategories();
                wpmfFoldersTreeModule.loadTreeView();
                
                // Initialize folder tree resizing
                wpmfFoldersTreeModule.initContainerResizing($current_frame);
            });
        },

        /**
         * Import categories from wpmf main module
         */
        importCategories: function importCategories() {
            var folders_ordered = wpmfFoldersModule.categories;

            var folder_order = wpmfFoldersModule.folders_order;
            if (typeof folder_order !== "undefined") {
                wpmfFoldersModule.folder_ordering = folder_order;
            } else {
                wpmfFoldersModule.folder_ordering = 'name-ASC';
            }

            // Order the array depending on main ordering
            switch (wpmfFoldersModule.folder_ordering) {
                default:
                case 'name-ASC':
                    folders_ordered = Object.values(folders_ordered).sort(function (a, b) {
                        if (a.id === 0) return -1; // Root folder is always first
                        if (b.id === 0) return 1; // Root folder is always first
                        return a.label.localeCompare(b.label);
                    });
                    break;
                case 'name-DESC':
                    folders_ordered = Object.values(folders_ordered).sort(function (a, b) {
                        if (a.id === 0) return -1; // Root folder is always first
                        if (b.id === 0) return 1; // Root folder is always first
                        return b.label.localeCompare(a.label);
                    });
                    break;
                case 'id-ASC':
                    folders_ordered = Object.values(folders_ordered).sort(function (a, b) {
                        if (a.id === 0) return -1; // Root folder is always first
                        if (b.id === 0) return 1; // Root folder is always first
                        return a.id - b.id;
                    });
                    break;
                case 'id-DESC':
                    folders_ordered = Object.values(folders_ordered).sort(function (a, b) {
                        if (a.id === 0) return -1; // Root folder is always first
                        if (b.id === 0) return 1; // Root folder is always first
                        return b.id - a.id;
                    });
                    break;
                case 'custom':
                    folders_ordered = Object.values(folders_ordered).sort(function (a, b) {
                        if (a.id === 0 && b.id !== 0) return -1; // Root folder is always first
                        if (a.id !== 0 && b.id === 0) return 1; // Root folder is always first
                        // Make sure id = -1 always comes after id 0 and before other ids
                        if (a.id === -1 && b.id !== -1) return -1;
                        if (a.id !== -1 && b.id === -1) return 1;
                        return a.order - b.order;
                    });
                    break;
            }

            // Reorder array based on children
            var folders_ordered_deep = [];
            var processed_ids = [];
            var loadChildren = function loadChildren(id) {
                if (processed_ids.indexOf(id) < 0) {
                    processed_ids.push(id);
                    for (var ij = 0; ij < folders_ordered.length; ij++) {
                        if (folders_ordered[ij].parent_id === id) {
                            folders_ordered_deep.push(folders_ordered[ij]);
                            loadChildren(folders_ordered[ij].id);
                        }
                    }
                }
            };

            loadChildren(0);
            // Finally save it to the global var
            wpmfFoldersTreeModule.categories = folders_ordered_deep;
        },

        /**
         * Render tree view inside content
         */
        loadTreeView: function loadTreeView() {
            // update height for folder tree when toggle menu
            if (wpmf.vars.wpmf_pagenow !== 'upload.php') {
                var $current_frame = wpmfFoldersTreeModule.getTreeElement().closest('.media-frame');
                var $menu = $current_frame.find('.media-frame-menu');
                if (!$current_frame.find('.wpmf-toggle-media-menu').length) {
                    $current_frame.addClass('wpmf_hide_media_menu');
                    $current_frame.find('.media-frame-menu-heading').append('<span class="material-icons wpmf-toggle-media-menu wpmf-toggle-down"> arrow_drop_down </span><span class="material-icons wpmf-toggle-media-menu wpmf-toggle-up"> arrow_drop_up </span>');
                    $current_frame.find('.wpmf-toggle-media-menu').off('click').bind('click', function () {
                        var h = 220;
                        if ($menu.find('.wpmf-all-tree').hasClass('wpmf-tree-loadmore')) {
                            h += 70;
                        }
                        if ($current_frame.hasClass('wpmf_hide_media_menu')) {
                            $current_frame.removeClass('wpmf_hide_media_menu').addClass('wpmf_show_media_menu');
                            var a = $menu.find(".media-menu-item").length;
                            $menu.find('.wpmf-all-tree').height($menu.height() - 34 * a - h);
                        } else {
                            $current_frame.removeClass('wpmf_show_media_menu').addClass('wpmf_hide_media_menu');
                            $menu.find('.wpmf-all-tree').height($menu.height() - h);
                        }
                    });
                }
            }

            // render folder tree
            wpmfFoldersTreeModule.getTreeElement().html(wpmfFoldersTreeModule.getRendering());
            wpmfFoldersTreeModule.initContainerResizing(wpmfFoldersModule.getFrame());
            $('.wpmf-loadmore-folder').unbind('click').bind('click', function () {
                var count = $(this).data('count');
                count += parseInt(wpmfFoldersModule.limit_folders);
                if (parseInt(count) < wpmfFoldersModule.categories_order_full.length) {
                    wpmfFoldersModule.categories_order = wpmfFoldersModule.categories_order_full.slice(0, count);
                    wpmfFoldersModule.trigger('loadmoreFolder');
                }
            });

            $('.wpmf-cancel-remove-folders-btn').unbind('click').bind('click', function (e) {
                e.preventDefault();
                $('.wpmf-folder-actions').toggleClass('wpmf-deactivate');
                $('.wpmf-tree-actions').find('.wpmf-new-folder').removeClass('hide');
                $('.wpmf-tree-checkbox').addClass('hide');
            });

            $('.wpmf-remove-folders-btn').unbind('click').bind('click', function (e) {
                e.preventDefault();
                if (!$(this).hasClass('disabled')) {
                    var ids = [];
                    $('.wpmf-tree-checkbox:checked').each(function (i, checkbox) {
                        var folder_id = $(checkbox).val();
                        ids.push(folder_id);
                    });
                    showDialog({
                        title: wpmf.l18n.delete_multiple_folder.replace('%d', ids.length),
                        negative: {
                            title: wpmf.l18n.cancel
                        },
                        positive: {
                            title: wpmf.l18n.delete,
                            onClick: function onClick() {
                                wpmfFoldersModule.deleteMultipleFolders(ids);
                            }
                        }
                    });
                }
            });

            $('.wpmf-tree-checkbox').unbind('click').bind('click', function () {
                if ($(this).is(':checked')) {
                    $(this).closest('li').find('ul .wpmf-tree-checkbox').prop('checked', true);
                } else {
                    $(this).closest('li').find('ul .wpmf-tree-checkbox').prop('checked', false);
                }
                if ($('.wpmf-tree-checkbox:checked').length) {
                    $('.wpmf-remove-folders-btn').removeClass('disabled');
                } else {
                    $('.wpmf-remove-folders-btn').addClass('disabled');
                }
            });

            // load count by subfolders
            if (wpmfFoldersModule.show_files_count) {
                if (wpmfFoldersTreeModule.categories.length < 1000) {
                    wpmfFoldersTreeModule.loadCountAll();
                } else {
                    wpmfFoldersTreeModule.getTreeElement().addClass('wpmf-many-folders');
                }
            }
            wpmfFoldersModule.openContextMenuFolder();
            var append_element = void 0;

            if (wpmfFoldersModule.page_type === 'upload-list') {
                append_element = '#posts-filter';
            } else {
                append_element = '.media-frame';
            }

            var folder_order = wpmfFoldersModule.folders_order;
            var sortable = false;
            if (typeof folder_order !== "undefined" && folder_order === 'custom') {
                sortable = true;
            }

            if (sortable) {
                if ($().sortable) {
                    wpmfFoldersTreeModule.getTreeElement().find('ul').sortable({
                        placeholder: 'wpmf_tree_drop_sort',
                        delay: 100, // Prevent dragging when only trying to click
                        distance: 10,
                        cursorAt: { top: 10, left: 10 },
                        revert: true,
                        revertDuration: 1000,
                        scroll: false,
                        /*tolerance: "intersect",*/
                        helper: function helper(ui) {
                            var helper = '<div class="wpmf-move-element">';
                            helper += '<span class="mdc-list-item__start-detail"><i class="material-icons wpmf-icon-category">folder</i></span>';
                            helper += '<span class="mdc-list-item__text"> ' + wpmf.l18n.folder_moving_text + ' </span>';
                            helper += '</div>';
                            return helper;
                        },
                        /** Prevent firefox bug positionnement **/
                        start: function start(event, ui) {
                            wpmfFoldersTreeModule.getTreeElement().addClass('wpmf_tree_sorting');
                            var userAgent = navigator.userAgent.toLowerCase();
                            if (ui.helper !== "undefined" && userAgent.match(/firefox/)) {
                                ui.helper.css('position', 'absolute');
                            }
                        },
                        stop: function stop(event, ui) {
                            wpmfFoldersTreeModule.getTreeElement().removeClass('wpmf_tree_sorting');
                        },
                        beforeStop: function beforeStop(event, ui) {},
                        update: function update(event, ui) {
                            var order = '';
                            $(event.target).find('li').each(function (i, val) {
                                var id = $(val).data('id');
                                if (id !== 0) {
                                    if (order !== '') {
                                        order += ',';
                                    }
                                    order += '"' + i + '":' + id;
                                    wpmfFoldersModule.categories[id].order = i;
                                }
                            });
                            order = '{' + order + '}';

                            $.ajax({
                                type: "POST",
                                url: ajaxurl,
                                data: {
                                    action: "wpmf_folder_post_type",
                                    task: "reorderfolder",
                                    folder_post_type_name: wpmfFoldersModule.taxonomy, 
                                    order: order,
                                    wpmf_nonce: wpmf.vars.wpmf_nonce
                                },
                                success: function success(res) {
                                    if (typeof res.status !== "undefined") {
                                        if (res.status) {
                                            wpmfFoldersTreeModule.importCategories();
                                            wpmfFoldersTreeModule.loadTreeView();
                                            wpmfFoldersModule.renderFolders();
                                        }
                                    }
                                }
                            });
                        }
                    }).disableSelection();
                }
            } else {
                if ($().draggable) {
                    // Initialize dragping folder on tree view
                    wpmfFoldersTreeModule.getTreeElement().find('ul li .wpmf-item[data-id!="0"]').draggable({
                        revert: true,
                        revertDuration: 1000,
                        helper: function helper(ui) {
                            var helper = '<div class="wpmf-move-element">';
                            helper += '<span class="mdc-list-item__start-detail" role="presentation"><i class="material-icons wpmf-icon-category">folder</i></span>';
                            helper += '<span class="mdc-list-item__text"> ' + wpmf.l18n.folder_moving_text + ' </span>';
                            helper += '</div>';
                            return helper;
                        },
                        appendTo: append_element,
                        delay: 100, // Prevent dragging when only trying to click
                        distance: 10,
                        cursorAt: { top: 0, left: 0 },
                        drag: function drag() {},
                        start: function start(event, ui) {
                            // Add the original size of element
                            $(ui.helper).css('width', $(ui.helper.context).outerWidth() + 'px');
                            $(ui.helper).css('height', $(ui.helper.context).outerWidth() + 'px');

                            // Add some style to original elements
                            $(this).addClass('wpmf-dragging');
                        },
                        stop: function stop(event, ui) {
                            // Revert style
                            $(this).removeClass('wpmf-dragging');
                        }
                    });
                }
            }

            if ($().droppable) {
                // Initialize dropping folder on tree view
                wpmfFoldersTreeModule.getTreeElement().find('ul li .wpmf-item-inside').droppable({
                    hoverClass: "wpmf-hover-folder",
                    tolerance: 'pointer',
                    over: function over(event, ui) {
                        $('.wpmf_tree_drop_sort').hide();
                    },
                    out: function out(event, ui) {
                        $('.wpmf_tree_drop_sort').show();
                    },
                    drop: function drop(event, ui) {
                        event.stopPropagation();
                        $(ui.helper).addClass('wpmf_dragout');
                        var folderID = $(this).data('id');
                        if ($(ui.draggable).hasClass('wpmf-folder') || $(ui.draggable).hasClass('wpmf-item') || (sortable && (!$(ui.draggable).hasClass('wpmf-folder-move-multiple') && !$(ui.draggable).hasClass('wpmf-folder-move-file')))) {
                            // move folder with folder tree
                            wpmfFoldersModule.moveFolder($(ui.draggable).data('id'), folderID);
                        } else {
                            // Assign folder to post
                            if ($(ui.draggable).hasClass('wpmf-folder-move-multiple') || ($(ui.draggable).hasClass('wpmf-folder-move-file') && $(".wp-list-table tbody .check-column input:checked").length) ) {
                                $.ajax({
                                    type: "POST",
                                    url: wpmf.vars.ajaxurl,
                                    data: {
                                        action: 'wpmf_folder_post_type',
                                        task: 'assign_folder_to_post',
                                        type: 'multiple',
                                        post_id: $('.wpmf-folder-move-multiple input').val(),
                                        folder_id: folderID,
                                        folder_post_type_name: wpmfFoldersModule.taxonomy,
                                        post_type: wpmfFoldersModule.post_type,
                                        wpmf_nonce: wpmf.vars.wpmf_nonce
                                    },
                                    success: function success(response) {
                                        if (typeof response.status !== "undefined") {
                                            if (response.status) {
                                                wpmfFoldersModule.categories = response.categories;
                                                wpmfFoldersTreeModule.importCategories();
                                                wpmfFoldersTreeModule.loadTreeView();

                                                var ajaxURL = wpmf.vars.current_url;
                                                var lastAccessFolder = wpmfFoldersModule.getCookie('lastAccessFolder_' + wpmf.vars.host);
                                                if (typeof wpmfFoldersModule.categories[lastAccessFolder] !== 'undefined') {
                                                    var folderName = wpmfFoldersModule.categories[lastAccessFolder].slug;
                                                    var urlParams = new URLSearchParams(window.location.search);
                                                    if (typeof urlParams.get(wpmfFoldersModule.taxonomy) !== 'undefined' && (urlParams.get(wpmfFoldersModule.taxonomy) === '' || urlParams.get(wpmfFoldersModule.taxonomy) === null )) {
                                                        ajaxURL += folderName;
                                                    }
                                                }
                                                $("#wpbody").load(ajaxURL + " #wpbody-content", false, function (res) {
                                                    var obj = { Title: "", Url: ajaxURL };
                                                    history.pushState(obj, obj.Title, obj.Url);

                                                    wpmfFoldersTreeModule.initModule(wpmfFoldersModule.getFrame());
                                                })
                                            } else {
                                                if (typeof response.error !== "undefined") {
                                                    //todo: change wrong variable name to something more understandable like message or error_message, and what should we do if wrong is set?
                                                    showDialog({
                                                        title: wpmf.l18n.information,
                                                        text: response.error,
                                                        closeicon: true
                                                    });
                                                }
                                            }
                                        }
                                    }
                                })
                            } else if($(ui.draggable).hasClass('wpmf-folder-move-file')) {
                                $.ajax({
                                    type: "POST",
                                    url: wpmf.vars.ajaxurl,
                                    data: {
                                        action: 'wpmf_folder_post_type',
                                        task: 'assign_folder_to_post',
                                        type: 'single',
                                        post_id: $(ui.draggable).data('id'),
                                        folder_id: folderID,
                                        folder_post_type_name: wpmfFoldersModule.taxonomy,
                                        post_type: wpmfFoldersModule.post_type,
                                        wpmf_nonce: wpmf.vars.wpmf_nonce
                                    },
                                    success: function success(response) {
                                        if (typeof response.status !== "undefined") {
                                            if (response.status) {
                                                wpmfFoldersModule.categories = response.categories;
                                                wpmfFoldersTreeModule.importCategories();
                                                wpmfFoldersTreeModule.loadTreeView();

                                                var ajaxURL = wpmf.vars.current_url;
                                                var lastAccessFolder = wpmfFoldersModule.getCookie('lastAccessFolder_' + wpmf.vars.host);
                                                if (typeof wpmfFoldersModule.categories[lastAccessFolder] !== 'undefined') {
                                                    var folderName = wpmfFoldersModule.categories[lastAccessFolder].slug;
                                                    var urlParams = new URLSearchParams(window.location.search);
                                                    if (typeof urlParams.get(wpmfFoldersModule.taxonomy) !== 'undefined' && (urlParams.get(wpmfFoldersModule.taxonomy) === '' || urlParams.get(wpmfFoldersModule.taxonomy) === null )) {
                                                        ajaxURL += folderName;
                                                    }
                                                }
                                                $("#wpbody").load(ajaxURL + " #wpbody-content", false, function (res) {
                                                    var obj = { Title: "", Url: ajaxURL };
                                                    history.pushState(obj, obj.Title, obj.Url);

                                                    wpmfFoldersTreeModule.initModule(wpmfFoldersModule.getFrame());
                                                })
                                            } else {
                                                if (typeof response.error !== "undefined") {
                                                    //todo: change wrong variable name to something more understandable like message or error_message, and what should we do if wrong is set?
                                                    showDialog({
                                                        title: wpmf.l18n.information,
                                                        text: response.error,
                                                        closeicon: true
                                                    });
                                                }
                                            }
                                        }
                                    }
                                })
                            }
                        }
                    }
                });
            }

            if ($().draggable) {
                // Initialize dragping folder on tree view
                jQuery('.wpmf-folder-move-file').draggable({
                    revert: true,
                    revertDuration: 1000,
                    helper: function helper(ui) {
                        var helper = '<div class="wpmf-move-element">';
                        helper += $(this).html();
                        helper += '</div>';

                        var counter = 0;
                        var selected_txt = wpmf.l18n.select_this_item;
                        if($(".wp-list-table tbody .check-column input:checked").length) {
                            var chkStr = "";
                            $(".wp-list-table tbody .check-column input:checked").each(function(){
                                chkStr += $(this).val()+",";
                                counter++;
                            });
                            $('.wpmf-folder-move-multiple input').val(chkStr);
                            selected_txt = wpmf.l18n.item_selected;
                            if (counter > 1) {
                                selected_txt = wpmf.l18n.items_selected;
                            }
                            selected_txt = counter + ' ' + selected_txt;
                        }
                        helper = '<div class="wpmf-move-element">';
                        helper += '<span>' + selected_txt + '</span>';
                        helper += '</div>';

                        return helper;
                    },
                    appendTo: $('body'),
                    delay: 100, // Prevent dragging when only trying to click
                    distance: 10,
                    cursorAt: { top: 0, left: 0 },
                    drag: function drag() {},
                    start: function start(event, ui) {
                        // Add the original size of element
                        $(ui.helper).css('width', $(ui.helper.context).outerWidth() + 'px');
                        $(ui.helper).css('height', $(ui.helper.context).outerWidth() + 'px');

                        // Add some style to original elements
                        $(this).addClass('wpmf-dragging');
                    },
                    stop: function stop(event, ui) {
                        // Revert style
                        $(this).removeClass('wpmf-dragging');
                    }
                });
                $('.wpmf-folder-move-multiple').draggable({
                    revert: true,
                    revertDuration: 1000,
                    helper: function helper(ui) {
                        var counter = 0;
                        var selected_txt = wpmf.l18n.select_item;
                        if($(".wp-list-table tbody .check-column input:checked").length) {
                            var chkStr = "";
                            $(".wp-list-table tbody .check-column input:checked").each(function(){
                                chkStr += $(this).val()+",";
                                counter++;
                            });
                            $('.wpmf-folder-move-multiple input').val(chkStr);
                            selected_txt = wpmf.l18n.item_selected;
                            if (counter > 1) {
                                selected_txt = wpmf.l18n.items_selected;
                            }
                            selected_txt = counter + ' ' + selected_txt;
                        }
                        var helper = '<div class="wpmf-move-element">';
                        helper += '<span>' + selected_txt + '</span>';
                        helper += '</div>';
                        return helper;
                    },
                    appendTo: $('body'),
                    delay: 100, // Prevent dragging when only trying to click
                    distance: 10,
                    cursorAt: { top: 0, left: 0 },
                    drag: function drag() {},
                    start: function start(event, ui) {
                        // Add the original size of element
                        $(ui.helper).css('width', $(ui.helper.context).outerWidth() + 'px');
                        $(ui.helper).css('height', $(ui.helper.context).outerWidth() + 'px');

                        // Add some style to original elements
                        $(this).addClass('wpmf-dragging');
                    },
                    stop: function stop(event, ui) {
                        // Revert style
                        $(this).removeClass('wpmf-dragging');
                    }
                });

            }

            // Initialize change keyword to search folder
            wpmfFoldersTreeModule.getTreeElement().find('.searchfolder').on('click', function (e) {
                wpmfFoldersTreeModule.doSearch();
            });

            // search with enter key
            $('.wpmf_search_folder').on('keypress', function (e) {
                if (e.which === 13) {
                    wpmfFoldersTreeModule.doSearch();
                    return false;
                }
            });

            $(".wpmf_search_folder").wpmfHandleKeyboardChange(1000).change(function () {
                wpmfFoldersTreeModule.doSearch();
            });

            // Initialize double click to folder title on tree view
            wpmfFoldersTreeModule.getTreeElement().find('ul .wpmf-item[data-id]').wpmfSingleDoubleClick(function (e) {
                if ($(e.target).hasClass('wpmf-arrow') || $(e.target).hasClass('wpmf-tree-checkbox')) {
                    return;
                }
                if (!$(e.target).closest('.wpmf-item').find('.wpmf-tree-checkbox').hasClass('hide') && $(e.target).closest('.wpmf-item').data('id') > 0) {
                    return;
                }
                // single click
                var id = $(this).data('id');
                if (parseInt(id) !== parseInt(wpmfFoldersModule.last_selected_folder)) {
                    wpmfFoldersModule.changeFolder(id);
                }
            }, function (e) {
                // double click
                var id = $(this).data('id');
                wpmfFoldersModule.clickEditFolder(e, id);
                wpmfFoldersModule.houtside();
            });

            var folderStatus = wpmf.vars.minimize_folder_tree;
            if (typeof wpmf.vars.folder_tree_status[wpmf.vars.post_type] !== 'undefined') {
                folderStatus = wpmf.vars.folder_tree_status[wpmf.vars.post_type];
            }
            if (wpmfFoldersTreeModule.folder_tree_status !== '') {
                folderStatus = wpmfFoldersTreeModule.folder_tree_status;
            }
            if (folderStatus == 'show') {
                var classHideFolderBtn = 'active';
                var classShowFolderBtn = '';
            } else {
                var classHideFolderBtn = '';
                var classShowFolderBtn = 'active';
            }
            var show_hide_btn = '<div class="wpmf-hide-show-buttons">';
                show_hide_btn += '<div class="toggle-buttons hide-folders '+classHideFolderBtn+'"><span class="dashicons dashicons-arrow-left"></span></div>';
                show_hide_btn += '<div class="toggle-buttons show-folders '+classShowFolderBtn+'"><span class="dashicons dashicons-arrow-right"></span></div>';
                show_hide_btn += '</div>';
            wpmfFoldersTreeModule.getTreeElement().append(show_hide_btn);

            wpmfFoldersTreeModule.getTreeElement().append('<div class="wpmf-all-tree scrollbar-inner"></div>');
            wpmfFoldersTreeModule.getTreeElement().find('.wpmf_media_library').appendTo(wpmfFoldersTreeModule.getTreeElement().find('.wpmf-all-tree'));

            // load scroll bar
            if (wpmfFoldersTreeModule.getTreeElement().find('.wpmf-all-tree').is(':visible')) {
                wpmfFoldersTreeModule.getTreeElement().find('.wpmf-all-tree').scrollbar();
                if (wpmf.vars.wpmf_pagenow !== 'upload.php') {
                    var $menu1 = wpmfFoldersTreeModule.getTreeElement().closest('.media-frame').find('.media-frame-menu');
                    var h = 220;
                    if ($menu1.find('.wpmf-all-tree').hasClass('wpmf-tree-loadmore')) {
                        h += 70;
                    }
                    $menu1.find('.wpmf-all-tree').height($menu1.height() - h);
                }
            }
            // if (wpmfFoldersModule.categories_order_full.length > wpmfFoldersModule.limit_folders) {
            //     $('.wpmf-all-tree').addClass('wpmf-tree-loadmore');
            // }
        },

        loadCountAll: function loadCountAll() {
            wpmfFoldersTreeModule.getTreeElement().find('li').each(function (i, element) {
                var id = $(element).data('id');
                if (parseInt(id) !== 0) {
                    var countElements = $(element).find('.wpmf-item-count');
                    var count = 0;
                    $(countElements).each(function (index, countElement) {
                        count += parseInt($(countElement).html());
                    });

                    $(element).find('> .wpmf-item .wpmf-item-count-all').html(count);
                }
            });
        },

        /**
         *  Do search folder
         */
        doSearch: function doSearch() {
            // search on folder tree
            var keyword = $('.wpmf_search_folder').val().trim().toLowerCase();
            var search_folders = [];
            // get folder when disable folders on right bar
            var folder_search = [];
            for (var folder_id in wpmfFoldersModule.categories) {
                if (keyword !== '') {
                    keyword = keyword.trim().toLowerCase();
                    var folder_name = wpmfFoldersModule.categories[folder_id].lower_label;
                    if (folder_name.indexOf(keyword) !== -1) {
                        folder_search.push(folder_id);
                    }
                }
            }
            search_folders = folder_search;
            if (keyword !== '') {
                $('.wpmf-main-tree li').addClass('folderhide').removeClass('foldershow');
                $.each(search_folders, function (i, v) {
                    $('.wpmf-main-tree li[data-id="' + v + '"]').addClass('foldershow').removeClass('folderhide closed');
                    $('.wpmf-main-tree li[data-id="' + v + '"]').parents('.wpmf-main-tree li').addClass('foldershow').removeClass('folderhide closed');
                });

                if ($('.foldershow').length) {
                    $('.search_no_result_wrap').hide();
                    wpmfFoldersTreeModule.getTreeElement().find('.wpmf-all-tree').show();
                } else {
                    $('.search_no_result_wrap').show();
                    wpmfFoldersTreeModule.getTreeElement().find('.wpmf-all-tree').hide();
                }
            } else {
                $('.wpmf-main-tree li').removeClass('foldershow folderhide');
                $('.search_no_result_wrap').hide();
                wpmfFoldersTreeModule.getTreeElement().find('.wpmf-all-tree').show();
            }
        },

        /**
         * Get the html resulting tree view
         * @return {string}
         */
        getRendering: function getRendering() {
            var ij = 0;
            var content = ''; // Final tree view cwpmf-main-tree-resizeontent
            // render search folder box
            var search_folder = '\n            <div class="wpmf-expandable-search mdl-cell--hide-phone">\n                <form action="#">\n                  <input type="text" class="wpmf_search_folder" placeholder="' + wpmf.l18n.search_folder + '" size="1">\n                </form>\n                <i class="material-icons searchfolder">search</i>\n            </div>\n            ';

            var remove_folder = '<div class="wpmf-folder-actions wpmf-deactivate">\n    <a href="#" class="wpmf-folder-btn wpmf-remove-folders-btn disabled"> <span>' + wpmf.l18n.delete + '</span></a>\n    <span class="wpmf-line-vertical"></span>\n        <a class="wpmf-folder-btn wpmf-cancel-remove-folders-btn" href="#"><span>' + wpmf.l18n.cancel + '</span></a>\n</div>';

            var search_no_result = '<div class="search_no_result_wrap">\n<svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path fill-rule="evenodd" clip-rule="evenodd" d="M25.1037 14.5194C22.2246 17.3996 20.3095 21.1018 19.6223 25.116C18.9351 29.1301 19.5097 33.2585 21.2669 36.9325C22.5392 39.5839 24.3918 41.915 26.6875 43.7531C26.383 45.1912 26.2363 46.6582 26.25 48.1281V48.8719C25.55 48.3906 24.85 47.9094 24.1938 47.3844L7.65625 63.4406L4.375 60.5531L21 44.4094C18.4207 41.4927 16.5876 37.9938 15.6582 34.2128C14.7287 30.4318 14.7307 26.4818 15.6638 22.7017C16.597 18.9216 18.4335 15.4245 21.0157 12.5104C23.5979 9.59633 26.8487 7.35238 30.489 5.97118C34.1294 4.58998 38.0505 4.11277 41.9158 4.58053C45.7812 5.04829 49.4753 6.44704 52.681 8.65671C55.8868 10.8664 58.5085 13.821 60.3211 17.2669C62.1336 20.7128 63.0829 24.5471 63.0875 28.4406C63.0875 29.6131 63 30.7812 62.825 31.9406C61.5687 30.7995 60.1894 29.8017 58.7125 28.9656V28.4406C58.7125 24.5468 57.5579 20.7404 55.3946 17.5027C53.2313 14.2651 50.1565 11.7417 46.5591 10.2516C42.9617 8.76145 39.0031 8.37157 35.1841 9.13123C31.3651 9.89089 27.8571 11.766 25.1037 14.5194V14.5194ZM38.4037 33.5769C40.3144 32.2859 42.4612 31.3853 44.721 30.9267C46.9808 30.4681 49.309 30.4607 51.5717 30.9047C53.8344 31.3488 55.987 32.2357 57.9058 33.5144C59.8246 34.7931 61.4718 36.4384 62.7528 38.3557C64.0337 40.2731 64.9231 42.4247 65.3698 44.6868C65.8165 46.949 65.8117 49.2772 65.3558 51.5375C64.8998 53.7978 64.0017 55.9458 62.7129 57.8579C61.4242 59.77 59.7703 61.4085 57.8463 62.6794C53.9868 65.2286 49.275 66.1462 44.7409 65.2316C40.2069 64.317 36.2193 61.6446 33.6499 57.7985C31.0804 53.9524 30.1381 49.2456 31.0289 44.7068C31.9197 40.168 34.5712 36.1664 38.4037 33.5769V33.5769ZM38.8413 57.4075C40.0603 58.6269 41.5076 59.5941 43.1005 60.254C44.6935 60.9138 46.4008 61.2533 48.125 61.2531C50.8508 61.261 53.5114 60.42 55.7375 58.8469L37.4063 40.5156C35.8331 42.7417 34.9921 45.4023 35 48.1281C35.0007 51.6088 36.384 54.9466 38.8456 57.4075H38.8413ZM40.5125 37.4137L58.8437 55.7406C60.4169 53.5145 61.2579 50.8539 61.25 48.1281C61.25 44.6471 59.8672 41.3087 57.4058 38.8473C54.9444 36.3859 51.606 35.0031 48.125 35.0031C45.3992 34.9952 42.7386 35.8362 40.5125 37.4094V37.4137Z" fill="black"/>\n</svg>\n<h4>' + wpmf.l18n.search_no_result + '</h4>\n</div>';

            // get last status folder tree
            var lastStatusTree = wpmfFoldersModule.getCookie('lastStatusTree_' + wpmf.vars.host);
            if (lastStatusTree !== '') {
                lastStatusTree = JSON.parse(lastStatusTree);
            }

            /**
             * Recursively print list of folders
             * @return {boolean}
             */
            var generateList = function generateList() {
                var tree_class = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

                content += '<ul class="' + tree_class + '">';

                while (ij < wpmfFoldersTreeModule.categories.length) {
                    var className = '';

                    // get color folder
                    var bgcolor = '',
                        odvColor = '';
                    if (typeof wpmf.vars.colors !== 'undefined' && typeof wpmf.vars.colors[wpmfFoldersTreeModule.categories[ij].id] !== 'undefined') {
                        bgcolor = 'color: ' + wpmf.vars.colors[wpmfFoldersTreeModule.categories[ij].id];
                        odvColor = wpmf.vars.colors[wpmfFoldersTreeModule.categories[ij].id];
                    } else {
                        bgcolor = 'color: #b2b2b2';
                        odvColor = '#b2b2b2';
                    }

                    var icondrive = void 0;
                    if (parseInt(wpmfFoldersTreeModule.categories[ij].id) === 0) {
                        icondrive = '<i class="wpmf-item-icon wpmf-item-icon-root"></i>';
                    } else if (parseInt(wpmfFoldersTreeModule.categories[ij].id) === -1) {
                        icondrive = '<i class="material-icons wpmf-item-icon">folder_open</i>';
                    } else {
                        icondrive = '<i class="material-icons wpmf-item-icon" style="' + bgcolor + '">folder</i>';
                    }

                    if (lastStatusTree.indexOf(wpmfFoldersTreeModule.categories[ij].id) !== -1 || parseInt(wpmfFoldersTreeModule.categories[ij].id) === 0) {
                        className += 'open ';
                    } else {
                        className += 'closed ';
                    }

                    var drive_root = false;

                    // get last access folder
                    var lastAccessFolder = wpmfFoldersModule.getCookie('lastAccessFolder_' + wpmf.vars.host);
                    // Select the last element which was selected in wpmf main module
                    if (typeof lastAccessFolder === "undefined" || typeof lastAccessFolder !== "undefined" && lastAccessFolder === '' || typeof lastAccessFolder !== "undefined" && parseInt(lastAccessFolder) === 0 || typeof wpmfFoldersModule.categories[lastAccessFolder] === "undefined") {
                        if (wpmfFoldersTreeModule.categories[ij].id === wpmfFoldersModule.last_selected_folder) {
                            className += 'selected ';
                        } else if (wpmfFoldersTreeModule.categories[ij].id === parseInt(lastAccessFolder)) {
                            className += 'selected ';
                        }
                    } else {
                        if (wpmfFoldersTreeModule.categories[ij].id === parseInt(lastAccessFolder)) {
                            className += 'selected ';
                        }
                    }

                    // Open li tag
                    content += '<li class="' + className + '" data-id="' + wpmfFoldersTreeModule.categories[ij].id + '">';
                    var pad = wpmfFoldersTreeModule.categories[ij].depth * 15;
                    content += '<div class="wpmf-item" data-id="' + wpmfFoldersTreeModule.categories[ij].id + '">';
                    content += '<div class="wpmf-item-inside" data-id="' + wpmfFoldersTreeModule.categories[ij].id + '" style="padding-left: ' + pad + 'px">';
                    var a_tag = '<a class="wpmf-text-item" data-id="' + wpmfFoldersTreeModule.categories[ij].id + '">';

                    if (drive_root) {
                        content += a_tag;
                    } else {
                        var input = '';
                        if (wpmfFoldersTreeModule.categories[ij].id != 0 && wpmfFoldersTreeModule.categories[ij].id != '-1') {
                            input = '<input type="checkbox" class="wpmf-tree-checkbox hide" value="' + wpmfFoldersTreeModule.categories[ij].id + '">';
                        }
                        if (wpmfFoldersTreeModule.categories[ij + 1] && wpmfFoldersTreeModule.categories[ij + 1].depth > wpmfFoldersTreeModule.categories[ij].depth) {
                            // The next element is a sub folder
                            content += '<a class="wpmf-toggle-icon" onclick="wpmfFoldersTreeModule.toggle(' + wpmfFoldersTreeModule.categories[ij].id + ')"><i class="tree_arrow_right_icon wpmf-arrow"></i></a>' + input;
                            content += a_tag;
                        } else {
                            content += '<a class="wpmf-toggle-icon wpmf-notoggle-icon"><i class="tree_arrow_right_icon"></i></a>' + input;
                            content += a_tag;
                        }
                    }

                    // Add folder icon
                    content += icondrive;

                    // Add current category name
                    content += '<span class="wpmf-item-title">' + wpmfFoldersTreeModule.categories[ij].label + '</span>';

                    content += '</a>';
                    if (wpmfFoldersTreeModule.categories[ij].item_count !== undefined) {
                        if (wpmfFoldersTreeModule.categories[ij].id === 0) {
                            if (wpmf.vars.root_media_count) {
                                content += '<span class="wpmf-item-count">' + wpmfFoldersTreeModule.categories[ij].item_count + '</span>';
                            }
                        } else {
                            content += '<span class="wpmf-item-count">' + wpmfFoldersTreeModule.categories[ij].item_count + '</span>';
                        }
                    }

                    if (wpmfFoldersTreeModule.categories[ij].item_count !== undefined) {
                        content += '<span class="wpmf-item-count-all">' + wpmfFoldersTreeModule.categories[ij].item_count + '</span>';
                    }
                    content += '</div></div>';
                    // This is the end of the array
                    if (wpmfFoldersTreeModule.categories[ij + 1] === undefined) {
                        // Let's close all opened tags
                        for (var ik = wpmfFoldersTreeModule.categories[ij].depth; ik >= 0; ik--) {
                            content += '</li>';
                            content += '</ul>';
                        }

                        // We are at the end don't continue to process array
                        return false;
                    }

                    if (wpmfFoldersTreeModule.categories[ij + 1].depth > wpmfFoldersTreeModule.categories[ij].depth) {
                        // The next element is a sub folder
                        // Recursively list it
                        ij++;
                        if (generateList() === false) {
                            // We have reached the end, let's recursively end
                            return false;
                        }
                    } else if (wpmfFoldersTreeModule.categories[ij + 1].depth < wpmfFoldersTreeModule.categories[ij].depth) {
                        // The next element don't have the same parent
                        // Let's close opened tags
                        for (var _ik = wpmfFoldersTreeModule.categories[ij].depth; _ik > wpmfFoldersTreeModule.categories[ij + 1].depth; _ik--) {
                            content += '</li>';
                            content += '</ul>';
                        }

                        // We're not at the end of the array let's continue processing it
                        return true;
                    }

                    // Close the current element
                    content += '</li>';
                    ij++;
                }
            };

            // Start generation
            generateList('wpmf_media_library');

            var loadmore = '';
            // if (wpmfFoldersModule.categories_order_full.length > wpmfFoldersModule.limit_folders) {
            //     loadmore = '<a class="wpmf-loadmore-folder" data-count="' + wpmfFoldersModule.categories_order.length + '"><span class="material-icons"> expand_more </span>' + wpmf.l18n.load_more + '</a>';
            // }

            // Add the new folder button
            content = '<div class="wpmf-tree-actions"><a class="wpmf-new-folder" onclick="wpmfFoldersModule.newFolder(wpmfFoldersModule.last_selected_folder)"><i class="material-icons">add</i>' + wpmf.l18n.create_folder + '</a>' + remove_folder + '</div>' + search_folder + content + loadmore + search_no_result;

            return content;
        },

        /**
         * Change the selected folder in tree view
         * @param folder_id
         */
        changeFolder: function changeFolder(folder_id) {
            // Remove previous selection
            wpmfFoldersTreeModule.getTreeElement().find('li').removeClass('selected');

            // Select the folder
            wpmfFoldersTreeModule.getTreeElement().find('li[data-id="' + folder_id + '"]').addClass('selected'). // Open parent folders
            parents('.wpmf-main-tree li.closed').removeClass('closed');
        },

        /**
         * Toggle the open / closed state of a folder
         * @param folder_id
         */
        toggle: function toggle(folder_id) {
            // get last status folder tree
            var lastStatusTree = [];
            // Check is folder has closed class
            if (wpmfFoldersTreeModule.getTreeElement().find('li[data-id="' + folder_id + '"]').hasClass('closed')) {
                // Open the folder
                wpmfFoldersTreeModule.openFolder(folder_id);
            } else {
                // Close the folder
                wpmfFoldersTreeModule.closeFolder(folder_id);
                // close all sub folder
                $('li[data-id="' + folder_id + '"]').find('li').addClass('closed');
            }

            wpmfFoldersTreeModule.getTreeElement().find('li:not(.closed)').each(function (i, v) {
                var id = $(v).data('id');
                lastStatusTree.push(id);
            });
            // set last status folder tree
            wpmfFoldersModule.setCookie("lastStatusTree_" + wpmf.vars.host, JSON.stringify(lastStatusTree), 365);
        },

        /**
         * Open a folder to show children
         */
        openFolder: function openFolder(folder_id) {
            wpmfFoldersTreeModule.getTreeElement().find('li[data-id="' + folder_id + '"]').removeClass('closed');
            wpmfFoldersTreeModule.folders_states[folder_id] = 'open';
        },

        /**
         * Close a folder and hide children
         */
        closeFolder: function closeFolder(folder_id) {
            wpmfFoldersTreeModule.getTreeElement().find('li[data-id="' + folder_id + '"]').addClass('closed');
            wpmfFoldersTreeModule.folders_states[folder_id] = 'close';
        },

        /**
         * Initialize the fixed position when user is scrolling
         * to keep the folder tree always visible
         */
        initFixedScrolling: function initFixedScrolling() {
            setTimeout(function () {
                // Fix initial left margin in list view
                if (wpmfFoldersModule.page_type === 'upload-list' || wpmfFoldersModule.page_type === 'upload-grid') {
                    var $tree = $('.wpmf-main-tree');
                    var tree_width = $tree.outerWidth() + 'px';
                    var $admin_bar_height = $('#wpadminbar').height();
                    if ($admin_bar_height > 32) {
                        $tree.css('top', $admin_bar_height + 'px');
                    }
                    $('#wpbody-content').css({ 'width': 'calc(100% - ' + tree_width + ')', 'margin-left': tree_width, 'opacity': 1, 'padding-left': '20px', 'box-sizing': 'border-box' });
                    // trigger window resize to set attachments columns
                    if (wpmfFoldersModule.page_type === 'upload-grid') {
                        $(window).trigger('resize');
                    }
                    $('.rtl #wpbody-content').css({
                        'margin-right': wpmfFoldersTreeModule.getTreeElement().outerWidth() + 'px',
                        'margin-left': 0,
                        'opacity': 1,
                        'padding-right': '20px',
                        'box-sizing': 'border-box'
                    });
                    $tree.css({ 'opacity': 1 });
                    // Remove the loader on list page
                    if (!$('.upload-php #posts-filter').hasClass('listview-loaded')) {
                        setTimeout(function () {
                            $('.upload-php #posts-filter').addClass('listview-loaded');
                        }, 200);
                    }
                }
            }, 200);
        },

        /**
         * Initialize folder tree resizing
         * @param $current_frame
         */
        initContainerResizing: function initContainerResizing($current_frame) {
            var is_resizing = false;
            var $body = $('body');

            $(window).on('resize', function () {
                $('.wpmf-all-tree.scrollbar-inner').scrollbar();
            });
            if (wpmf.vars.wpmf_pagenow === 'edit.php') {
                var $main = $('#wpbody');
                var $tree = $('.wpmf-main-tree');
                var $tree_max_width = 500;
                var $tree_min_width = 290;

                var $handle = $('<div class="wpmf-main-tree-resize"></div>').appendTo($tree);
                $handle.on('mousedown', function (e) {
                    is_resizing = true;
                    $('body').css('user-select', 'none'); // prevent content selection while moving
                });

                var folderStatus = wpmf.vars.minimize_folder_tree;
                if (typeof wpmf.vars.folder_tree_status[wpmf.vars.post_type] !== 'undefined') {
                    folderStatus = wpmf.vars.folder_tree_status[wpmf.vars.post_type];
                }
                if (wpmfFoldersTreeModule.folder_tree_status !== '') {
                    folderStatus = wpmfFoldersTreeModule.folder_tree_status;
                }

                wpmfFoldersTreeModule.minimizedFolderTree(folderStatus);
                if (folderStatus == 'show') {
                    var folderTreeSizeKey = wpmfFoldersModule.taxonomy;
                    var folderTreeSize = wpmfFoldersModule.getCookie(folderTreeSizeKey);
                    if (folderTreeSize < $tree_min_width) folderTreeSize = $tree_min_width;
                    if (typeof folderTreeSize !== "undefined" && parseFloat(folderTreeSize) > 0) {
                        $tree.css({ 'width': parseFloat(folderTreeSize) + 'px' });
                        var folder_tree_width = parseFloat(folderTreeSize) + 20;
                        if ($('body').hasClass('rtl')) {
                            $('#wpcontent').css({ 'padding-right': folder_tree_width + 'px', 'box-sizing': 'border-box' });
                        } else {
                            $('#wpcontent').css({ 'padding-left': folder_tree_width + 'px', 'box-sizing': 'border-box' });
                        }
                    }
                }

                $(document).on('mousemove', function (e) {
                    // we don't want to do anything if we aren't resizing.
                    if (!is_resizing) return;

                    // Calculate tree width
                    var tree_width = e.clientX - $tree.offset().left;
                    if (tree_width < $tree_min_width) tree_width = $tree_min_width;
                    if (tree_width > $tree_max_width) {
                        tree_width = $tree_max_width;
                    }


                    var folder_tree_width = tree_width + 20;

                    $tree.css('width', tree_width + 'px');
                    // We have to set margin if we are in a fixed tree position or in list page
                    if ($('body').hasClass('rtl')) {
                        $('#wpcontent').css({ 'padding-right': folder_tree_width + 'px', 'box-sizing': 'border-box' });
                    } else {
                        $('#wpcontent').css({ 'padding-left': folder_tree_width + 'px', 'box-sizing': 'border-box' });
                    }
                    wpmfFoldersModule.setCookie(folderTreeSizeKey, tree_width, 365);
                }).on('mouseup', function (e) {
                    if (is_resizing) {
                        // stop resizing
                        is_resizing = false;
                        $body.css('user-select', '');
                        $(window).trigger('resize');
                    }
                });
            }
        },

        minimizedFolderTree: function minimizedFolderTree(folderStatus) {
            if(folderStatus == "show") {
                var $tree = $('.wpmf-main-tree');
                var $tree_max_width = 500;
                var $tree_min_width = 290;
                var folderTreeSizeKey = wpmfFoldersModule.taxonomy;
                var folderTreeSize = wpmfFoldersModule.getCookie(folderTreeSizeKey);
                if (folderTreeSize < $tree_min_width) folderTreeSize = $tree_min_width;
                if (typeof folderTreeSize !== "undefined" && parseFloat(folderTreeSize) > 0) {
                    $tree.css({ 'width': parseFloat(folderTreeSize) + 'px' });
                    var folder_tree_width = parseFloat(folderTreeSize) + 20;
                    if ($('body').hasClass('rtl')) {
                        $('#wpcontent').css({ 'padding-right': folder_tree_width + 'px', 'box-sizing': 'border-box' });
                    } else {
                        $('#wpcontent').css({ 'padding-left': folder_tree_width + 'px', 'box-sizing': 'border-box' });
                    }
                }
                $('.wpmf-folder-post-type').removeClass('wpmf-hide-folder-tree');
            } else {
                if ($('body').hasClass('rtl')) {
                    $('#wpcontent').css({ 'padding-right': '25px', 'box-sizing': 'border-box' });
                } else {
                    $('#wpcontent').css({ 'padding-left': '25px', 'box-sizing': 'border-box' });
                }
                $('.wpmf-folder-post-type').addClass('wpmf-hide-folder-tree');
            }
        }
    };

    // Let's initialize WPMF folder tree features
    $(document).ready(function () {
        if (typeof wpmfFoldersModule !== "undefined") {
            var lastAccessFolder = wpmfFoldersModule.getCookie('lastAccessFolder_' + wpmf.vars.host);
            if (typeof lastAccessFolder !== 'undefined') {
                var lastAccessFolder = wpmfFoldersModule.getCookie('lastAccessFolder_' + wpmf.vars.host);
                if (typeof wpmfFoldersModule.categories[lastAccessFolder] === 'undefined') {
                    wpmfFoldersModule.setCookie('lastAccessFolder_' + wpmf.vars.host, 0, 365);
                }
            }

            wpmfFoldersTreeModule.initModule(wpmfFoldersModule.getFrame());

            $(document).on("click", ".subsubsub a", function(e){
                if($(".wpmf-folder-post-type .wpmf-main-tree").length) {
                    wpmfFoldersModule.setCookie('lastAccessFolder_' + wpmf.vars.host, 0, 365);
                }
            });

            var folderCheckListClass = 'ul.cat-checklist.'+wpmfFoldersModule.taxonomy+'-checklist input[type="checkbox"]';
            $(document).on('change', folderCheckListClass, function() {
                if ($(this).is(':checked')) {
                    $(folderCheckListClass).not(this).prop('checked', false);
                }
            });

            $(document).on('click', '.wpmf-hide-show-buttons .toggle-buttons', function() {
                var folderStatus = "show";
                if($(this).hasClass("hide-folders")) {
                    folderStatus = "hide";
                }
                $(".wpmf-hide-show-buttons .toggle-buttons").toggleClass("active");
                wpmfFoldersTreeModule.minimizedFolderTree(folderStatus);

                $.ajax({
                    type: "POST",
                    url: wpmf.vars.ajaxurl,
                    data: {
                        action: "wpmf_folder_post_type",
                        task: "change_folder_tree_display_status",
                        status: folderStatus,
                        post_type: wpmfFoldersModule.post_type,
                        wpmf_nonce: wpmf.vars.wpmf_nonce
                    },
                    success: function success(response) {
                        if (response.status) {
                            wpmfFoldersTreeModule.folder_tree_status = folderStatus;
                        }
                    }
                });
            });
        }
    });
})(jQuery);

// call single click or double click on folder tree
jQuery.fn.wpmfSingleDoubleClick = function (single_click_callback, double_click_callback, timeout) {
    return this.each(function () {
        var clicks = 0,
            self = this;
        jQuery(this).on('click', function (event) {
            clicks++;
            if (clicks === 1) {
                setTimeout(function () {
                    if (clicks === 1) {
                        single_click_callback.call(self, event);
                    } else {
                        double_click_callback.call(self, event);
                    }
                    clicks = 0;
                }, timeout || 300);
            }
        });
    });
};

jQuery.fn.wpmfHandleKeyboardChange = function (nDelay) {
    // Utility function to test if a keyboard event should be ignored
    function shouldIgnore(event) {
        var mapIgnoredKeys = {
            9: true, // Tab
            16: true, 17: true, 18: true, // Shift, Alt, Ctrl
            37: true, 38: true, 39: true, 40: true, // Arrows
            91: true, 92: true, 93: true // Windows keys
        };
        return mapIgnoredKeys[event.which];
    }

    // Utility function to fire OUR change event if the value was actually changed
    function fireChange($element) {
        if ($element.val() != jQuery.data($element[0], "valueLast")) {
            jQuery.data($element[0], "valueLast", $element.val());
            $element.trigger("change");
        }
    }

    // The currently running timeout,
    // will be accessed with closures
    var timeout = 0;

    // Utility function to cancel a previously set timeout
    function clearPreviousTimeout() {
        if (timeout) {
            clearTimeout(timeout);
        }
    }

    return this.keydown(function (event) {
        if (shouldIgnore(event)) return;
        // User pressed a key, stop the timeout for now
        clearPreviousTimeout();
        return null;
    }).keyup(function (event) {
        if (shouldIgnore(event)) return;
        // Start a timeout to fire our event after some time of inactivity
        // Eventually cancel a previously running timeout
        clearPreviousTimeout();
        var $self = jQuery(this);
        timeout = setTimeout(function () {
            fireChange($self);
        }, nDelay);
    }).change(function () {
        // Fire a change
        // Use our function instead of just firing the event
        // Because we want to check if value really changed since
        // our previous event.
        // This is for when the browser fires the change event
        // though we already fired the event because of the timeout
        fireChange(jQuery(this));
    });
};
