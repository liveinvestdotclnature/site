var wpmfExternalCatsImportModule;
(function ($) {
    wpmfExternalCatsImportModule = {
        category_name: '',
        categories: [],
        categories_order: [],
        init: function () {
            $('.open_import_external_cats').on('click', function () {
                wpmfExternalCatsImportModule.category_name = $(this).data('cat-name');
                var title = '';
                switch (wpmfExternalCatsImportModule.category_name) {
                    case "rml_category":
                        title = import_external_cats_objects.l18n.rml_label_dialog;
                        break;
                    case "media_category":
                        title = import_external_cats_objects.l18n.eml_label_dialog;
                        break;
                    case "happyfiles_category":
                        title = import_external_cats_objects.l18n.happyfiles_label_dialog;
                        break;
                    case "media_folder":
                        title = import_external_cats_objects.l18n.mf_label_dialog;
                        break;
                    case "filebird":
                        title = import_external_cats_objects.l18n.fbv_label_dialog;
                        break
                }

                var button = '<div class="wpmfexternal_cats_action">';
                button += '<button class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect wpmfexternal_cats_button wpmfexternal_cats_import_all_btn">'+ import_external_cats_objects.l18n.import_all_label +'</button>';
                button += '<button class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect wpmfexternal_cats_button wpmfexternal_cats_import_selected_btn">'+ import_external_cats_objects.l18n.import_selected_label +'</button>';
                button += '<button class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect wpmfexternal_cats_button wpmfexternal_cats_cancel_btn">'+ import_external_cats_objects.l18n.cancel_label +'</button>';
                button += '<span class="spinner" style="margin: 8px"></span>';
                button += '</div>';
                showDialog({
                    title: title,
                    id: 'import-external_cats-dialog',
                    text: '<div class="wpmfexternal_cats_categories_tree"></div>' + button
                });

                switch (wpmfExternalCatsImportModule.category_name) {
                    case "rml_category":
                        wpmfExternalCatsImportModule.categories_order = import_external_cats_objects.vars.rml_categories_order;
                        wpmfExternalCatsImportModule.categories = import_external_cats_objects.vars.rml_categories;
                        break;
                    case "media_category":
                        wpmfExternalCatsImportModule.categories_order = import_external_cats_objects.vars.media_category_categories_order;
                        wpmfExternalCatsImportModule.categories = import_external_cats_objects.vars.media_category_categories;
                        break;
                    case "happyfiles_category":
                        wpmfExternalCatsImportModule.categories_order = import_external_cats_objects.vars.happy_categories_order;
                        wpmfExternalCatsImportModule.categories = import_external_cats_objects.vars.happy_categories;
                        break;
                    case "media_folder":
                        wpmfExternalCatsImportModule.categories_order = import_external_cats_objects.vars.mf_categories_order;
                        wpmfExternalCatsImportModule.categories = import_external_cats_objects.vars.mf_categories;
                        break;
                    case "filebird":
                        wpmfExternalCatsImportModule.categories_order = import_external_cats_objects.vars.filebird_categories_order;
                        wpmfExternalCatsImportModule.categories = import_external_cats_objects.vars.filebird_categories;
                        break
                }


                wpmfExternalCatsImportModule.importCategories();
                // Render the tree view
                wpmfExternalCatsImportModule.loadTreeView();
                wpmfExternalCatsImportModule.handleClick();
            });

            $('.wpmfexternal_cats_notice .wpmf-notice-dismiss').unbind('click').bind('click', function () {
                $.ajax({
                    type: 'POST',
                    url: import_external_cats_objects.vars.ajaxurl,
                    data: {
                        action: "wpmf_update_external_cats_notice_flag",
                        wpmf_nonce: import_external_cats_objects.vars.wpmf_nonce
                    },
                    beforeSend: function () {
                        $('.wpmfexternal_cats_notice').remove();
                    },
                    success: function (res) {}
                });
            });
        },

        handleClick: function () {
            $('.wpmfexternal_cats-check').unbind('click').bind('click', function () {
                if ($(this).closest('.wpmfexternal_cats-item-check').hasClass('wpmfexternal_cats_checked')) {
                    $(this).closest('.wpmfexternal_cats-item-check').removeClass('wpmfexternal_cats_checked').addClass('wpmfexternal_cats_notchecked');
                    $(this).closest('li').find('ul .wpmfexternal_cats-item-check').removeClass('wpmfexternal_cats_checked').addClass('wpmfexternal_cats_notchecked');
                } else {
                    $(this).closest('.wpmfexternal_cats-item-check').addClass('wpmfexternal_cats_checked').removeClass('wpmfexternal_cats_notchecked');
                    $(this).closest('li').find('ul .wpmfexternal_cats-item-check').addClass('wpmfexternal_cats_checked').removeClass('wpmfexternal_cats_notchecked');
                }
                var parents = $(this).parents('li');
                $.each(parents, function (i, parent) {
                    var checked_length = $(parent).find(' > .wpmfexternal_cats_trees > li > .wpmfexternal_cats-item .wpmfexternal_cats_checked').length;
                    var not_checked_length = $(parent).find(' > .wpmfexternal_cats_trees > li > .wpmfexternal_cats-item .wpmfexternal_cats_notchecked').length;
                    if (checked_length && not_checked_length) {
                        $(parent).find('> .wpmfexternal_cats-item .wpmfexternal_cats-item-check').removeClass('wpmfexternal_cats_checked wpmfexternal_cats_notchecked').addClass('wpmfexternal_cats_part_checked');
                    }

                    if (checked_length && !not_checked_length) {
                        $(parent).find('> .wpmfexternal_cats-item .wpmfexternal_cats-item-check').removeClass('wpmfexternal_cats_part_checked wpmfexternal_cats_notchecked').addClass('wpmfexternal_cats_checked');
                    }

                    if (!checked_length && not_checked_length) {
                        $(parent).find('> .wpmfexternal_cats-item .wpmfexternal_cats-item-check').removeClass('wpmfexternal_cats_part_checked wpmfexternal_cats_checked').addClass('wpmfexternal_cats_notchecked');
                    }
                });

                if ($('.wpmfexternal_cats_checked').length) {
                    $('.wpmfexternal_cats_import_selected_btn').show();
                    $('.wpmfexternal_cats_import_all_btn').hide();
                } else {
                    $('.wpmfexternal_cats_import_selected_btn').hide();
                    $('.wpmfexternal_cats_import_all_btn').show();
                }
            });

            $('.wpmfexternal_cats_cancel_btn').unbind('click').bind('click', function () {
                var dialod = $('#import-external_cats-dialog');
                hideDialog(dialod);
            });

            $('.wpmfexternal_cats_import_all_btn').unbind('click').bind('click', function () {
                wpmfExternalCatsImportModule.getAndInsertAllExternalCatsCategories(1);
            });

            $('.wpmfexternal_cats_import_selected_btn').unbind('click').bind('click', function () {
                var ids = [];
                $('.wpmfexternal_cats_checked').each(function (i, checkbox) {
                    var id = $(checkbox).closest('.wpmfexternal_cats-item').data('id');
                    if (parseInt(id) !== 0) {
                        ids.push(id);
                    }
                });

                if (ids.length) {
                    wpmfExternalCatsImportModule.getAndInsertAllExternalCatsCategories(1, 'selected', ids);
                }
            });
        },

        getAndInsertAllExternalCatsCategories: function (paged, type = 'all', ids = []) {
            var data = {
                paged: paged,
                wpmf_nonce: import_external_cats_objects.vars.wpmf_nonce
            };

            switch (wpmfExternalCatsImportModule.category_name) {
                case "rml_category":
                    data.action = 'wpmf_get_insert_rml_categories';
                    break;
                case "media_category":
                    data.action = 'wpmf_get_insert_eml_categories';
                    break;
                case "happyfiles_category":
                    data.action = 'wpmf_get_insert_happyfiles_categories';
                    break;
                case "media_folder":
                    data.action = 'wpmf_get_insert_mf_categories';
                    break;
                case "filebird":
                    data.action = 'wpmf_get_insert_fbv_categories';
                    break
            }

            if (type === 'selected') {
                data.type = 'selected';
                data.ids = ids.join();
            }
            $.ajax({
                type: 'POST',
                url: import_external_cats_objects.vars.ajaxurl,
                data: data,
                beforeSend: function () {
                    $('.wpmfexternal_cats_action .spinner').css('visibility', 'visible').show();
                },
                success: function (res) {
                    if (res.status) {
                        if (res.continue) {
                            wpmfExternalCatsImportModule.getAndInsertAllExternalCatsCategories(parseInt(paged) + 1, type, ids);
                        } else {
                            // update parent and add object
                            wpmfExternalCatsImportModule.updateParentForImportedExternalCatsFolder(1)
                        }
                    }
                }
            });
        },

        updateParentForImportedExternalCatsFolder: function (paged) {
            var data = {
                paged: paged,
                wpmf_nonce: import_external_cats_objects.vars.wpmf_nonce
            };

            switch (wpmfExternalCatsImportModule.category_name) {
                case "rml_category":
                    data.action = 'wpmf_update_rml_categories';
                    break;
                case "media_category":
                    data.action = 'wpmf_update_eml_categories';
                    break;
                case "happyfiles_category":
                    data.action = 'wpmf_update_happyfiles_categories';
                    break;
                case "media_folder":
                    data.action = 'wpmf_update_mf_categories';
                    break;
                case "filebird":
                    data.action = 'wpmf_update_fbv_categories';
                    break
            }

            $.ajax({
                type: 'POST',
                url: import_external_cats_objects.vars.ajaxurl,
                data: data,
                success: function (res) {
                    if (res.status) {
                        if (res.continue) {
                            wpmfExternalCatsImportModule.updateParentForImportedExternalCatsFolder(parseInt(paged) + 1)
                        } else {
                            $('.wpmfexternal_cats_action .spinner').hide();
                            $('.wpmfexternal_cats_notice').remove();
                            var dialod = $('#import-external_cats-dialog');
                            hideDialog(dialod);
                            if (import_external_cats_objects.vars.pagenow === 'upload.php') {
                                location.reload();
                            }
                        }
                    }
                }
            });
        },

        importCategories: function () {
            var folders_ordered = [];

            // Add each category
            $(wpmfExternalCatsImportModule.categories_order).each(function () {
                folders_ordered.push(wpmfExternalCatsImportModule.categories[this]);
            });

            // Reorder array based on children
            var folders_ordered_deep = [];
            var processed_ids = [];
            var loadChildren = function loadChildren(id) {
                if (processed_ids.indexOf(id) < 0) {
                    processed_ids.push(id);
                    for (var ij = 0; ij < folders_ordered.length; ij++) {
                        if (parseInt(folders_ordered[ij].parent_id) === parseInt(id)) {
                            folders_ordered_deep.push(folders_ordered[ij]);
                            loadChildren(folders_ordered[ij].id);
                        }
                    }
                }
            };
            loadChildren(0);

            // Finally save it to the global var
            wpmfExternalCatsImportModule.categories = folders_ordered_deep;
        },

        /**
         * Render tree view inside content
         */
        loadTreeView: function () {
            $('.wpmfexternal_cats_categories_tree').html(wpmfExternalCatsImportModule.getRendering());
        },

        /**
         * Get the html resulting tree view
         * @return {string}
         */
        getRendering: function () {
            var ij = 0;
            var content = '';

            /**
             * Recursively print list of folders
             * @return {boolean}
             */
            var generateList = function () {
                content += '<ul class="wpmfexternal_cats_trees">';
                while (ij < wpmfExternalCatsImportModule.categories.length) {
                    var className = 'closed ';
                    // Open li tag
                    content += '<li class="' + className + '" data-id="' + wpmfExternalCatsImportModule.categories[ij].id + '">';
                    content += '<div class="wpmfexternal_cats-item" data-id="' + wpmfExternalCatsImportModule.categories[ij].id + '">';
                    content += '<div class="wpmfexternal_cats-item-inside" data-id="' + wpmfExternalCatsImportModule.categories[ij].id + '">';
                    var a_tag = '<a class="wpmfexternal_cats-text-item" data-id="' + wpmfExternalCatsImportModule.categories[ij].id + '">';
                    if (wpmfExternalCatsImportModule.categories[ij + 1] && wpmfExternalCatsImportModule.categories[ij + 1].depth > wpmfExternalCatsImportModule.categories[ij].depth) {
                        // The next element is a sub folder
                        content += '<a class="wpmfexternal_cats-toggle-icon" onclick="wpmfExternalCatsImportModule.toggle(' + wpmfExternalCatsImportModule.categories[ij].id + ')"><i class="material-icons wpmfexternal_cats-arrow">arrow_right</i></a>';
                    } else {
                        content += '<a class="wpmfexternal_cats-toggle-icon wpmfexternal_cats-notoggle-icon"><i class="material-icons wpmfexternal_cats-arrow">arrow_right</i></a>';
                    }

                    if (parseInt(wpmfExternalCatsImportModule.categories[ij].id) !== 0) {
                        content += '<a class="wpmfexternal_cats-item-check wpmfexternal_cats_notchecked"><span class="material-icons wpmfexternal_cats-check wpmfexternal_cats-item-checkbox-checked"> check_box </span><span class="material-icons wpmfexternal_cats-check wpmfexternal_cats-item-checkbox"> check_box_outline_blank </span><span class="material-icons wpmfexternal_cats-check wpmfexternal_cats-item-part-checkbox"> indeterminate_check_box </span></a>';
                    }
                    content += a_tag;

                    if (parseInt(wpmfExternalCatsImportModule.categories[ij].id) === 0) {
                        content += '<i class="wpmfexternal_cats-icon-root"></i>';
                    } else {
                        content += '<i class="material-icons wpmfexternal_cats-item-icon">folder</i>';
                    }
                    content += '<span class="wpmfexternal_cats-item-title" data-id="'+ wpmfExternalCatsImportModule.categories[ij].id +'">' + wpmfExternalCatsImportModule.categories[ij].label + '</span>';
                    content += '</a>';
                    content += '</div>';
                    content += '</div>';

                    // This is the end of the array
                    if (wpmfExternalCatsImportModule.categories[ij + 1] === undefined) {
                        // Let's close all opened tags
                        for (var ik = wpmfExternalCatsImportModule.categories[ij].depth; ik >= 0; ik--) {
                            content += '</li>';
                            content += '</ul>';
                        }

                        // We are at the end don't continue to process array
                        return false;
                    }

                    if (wpmfExternalCatsImportModule.categories[ij + 1].depth > wpmfExternalCatsImportModule.categories[ij].depth) {
                        // The next element is a sub folder
                        // Recursively list it
                        ij++;
                        if (generateList() === false) {
                            // We have reached the end, let's recursively end
                            return false;
                        }
                    } else if (wpmfExternalCatsImportModule.categories[ij + 1].depth < wpmfExternalCatsImportModule.categories[ij].depth) {
                        // The next element don't have the same parent
                        // Let's close opened tags
                        for (var _ik = wpmfExternalCatsImportModule.categories[ij].depth; _ik > wpmfExternalCatsImportModule.categories[ij + 1].depth; _ik--) {
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
            generateList();
            return content;
        },

        /**
         * Toggle the open / closed state of a folder
         * @param folder_id
         */
        toggle: function (folder_id) {
            // Check is folder has closed class
            if ($('.wpmfexternal_cats_categories_tree').find('li[data-id="' + folder_id + '"]').hasClass('closed')) {
                // Open the folder
                wpmfExternalCatsImportModule.openFolder(folder_id);
            } else {
                // Close the folder
                wpmfExternalCatsImportModule.closeFolder(folder_id);
                // close all sub folder
                $('li[data-id="' + folder_id + '"]').find('li').addClass('closed');
            }
        },

        /**
         * Open a folder to show children
         */
        openFolder: function (folder_id) {
            $('.wpmfexternal_cats_categories_tree').find('li[data-id="' + folder_id + '"]').removeClass('closed');
        },

        /**
         * Close a folder and hide children
         */
        closeFolder: function (folder_id) {
            $('.wpmfexternal_cats_categories_tree').find('li[data-id="' + folder_id + '"]').addClass('closed');
        }
    };

    $(document).ready(function () {
        wpmfExternalCatsImportModule.init();
    });
})(jQuery);