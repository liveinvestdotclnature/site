var selected_folder = null, curFolders = [], wpmf_list_import = '', current_page_watermark = 1, current_page_photograper = 1, status_regenthumbs_watermark = false, status_regenthumbs_photograper = false;
var wpmfTreeOptionsModule;
(function ($) {
    wpmfTreeOptionsModule = {
        categories: [], // categories
        /**
         * Import categories from wpmf main module
         */
        importCategories: function () {
            var folders_ordered = [];

            // Add each category
            $(wpmf.vars.wpmf_categories_order).each(function () {
                folders_ordered.push(wpmf.vars.wpmf_categories[this]);
            });

            // Reorder array based on children
            var folders_ordered_deep = [];
            var processed_ids = [];
            var loadChildren = function (id) {
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
            loadChildren(parseInt(wpmf.vars.term_root_id));

            // Finally save it to the global var
            wpmfTreeOptionsModule.categories = folders_ordered_deep;
        }
    };

    wpmfWatermarkTreeOptionsModule = {
        categories: [], // categories
        folders_states: [], // Contains open or closed status of folders
        element: '',

        /**
         * Retrieve the Jquery tree view element
         * of the current frame
         * @return jQuery
         */
        getTreeElement: function () {
            var element = wpmfWatermarkTreeOptionsModule.element;
            return $(element).find('.wpmf-folder-tree');
        },

        /**
         * Initialize module related things
         */
        initModule: function (element) {
            wpmfWatermarkTreeOptionsModule.element = element;
            // Add the tree view to the main content
            $('<div class="wpmf-folder-tree"></div>').appendTo($(element));

            // Render the tree view
            wpmfWatermarkTreeOptionsModule.loadTreeView();

            $.ajax({
                type: "POST",
                url: ajaxurl,
                data: {
                    action: 'wpmf_get_exclude_folders',
                    wpmf_nonce: wpmfoption.vars.wpmf_nonce
                },
                success: function (res) {
                    $.each(res.folders, function (i, v) {
                        $('.wpmf_watermark_exclude_folders[value="' + v + '"]').prop('checked', true).change();
                    });
                }
            });
        },

        /**
         * Render tree view inside content
         */
        loadTreeView: function (element) {
            wpmfWatermarkTreeOptionsModule.getTreeElement(element).html(wpmfWatermarkTreeOptionsModule.getRendering());
        },

        /**
         * Get the html resulting tree view
         * @return {string}
         */
        getRendering: function () {
            var ij = 0;
            var content = ''; // Final tree view content
            /**
             * Recursively print list of folders
             * @return {boolean}
             */
            var generateList = function generateList() {
                content += '<ul>';
                while (ij < wpmfTreeOptionsModule.categories.length) {
                    if (typeof wpmfTreeOptionsModule.categories[ij].drive_type !== "undefined" && wpmfTreeOptionsModule.categories[ij].drive_type !== '') {
                        ij++;
                        continue;
                    }
                    var className = 'closed';
                    // Open li tag
                    content += '<li class="' + className + '" data-id="' + wpmfTreeOptionsModule.categories[ij].id + '" >';

                    // get color folder
                    var bgcolor = '';
                    if (typeof wpmf.vars.colors !== 'undefined' && typeof wpmf.vars.colors[wpmfTreeOptionsModule.categories[ij].id] !== 'undefined') {
                        bgcolor = 'color: ' + wpmf.vars.colors[wpmfTreeOptionsModule.categories[ij].id];
                    } else {
                        bgcolor = 'color: #b2b2b2';
                    }

                    var text_label = '';
                    if (wpmfTreeOptionsModule.categories[ij + 1] && wpmfTreeOptionsModule.categories[ij + 1].depth > wpmfTreeOptionsModule.categories[ij].depth) { // The next element is a sub folder
                        content += '<a onclick="wpmfWatermarkTreeOptionsModule.toggle(' + wpmfTreeOptionsModule.categories[ij].id + ')"><i class="material-icons wpmf-arrow">keyboard_arrow_down</i></a>';
                    } else {
                        // Add folder icon
                        content += '<i class="material-icons wpmf-arrow" style="opacity: 0">keyboard_arrow_down</i></a>';
                    }
                    content += '<div class="pure-checkbox">';
                    if (wpmfTreeOptionsModule.categories[ij].id === 0) {
                        text_label = wpmf.l18n.media_folder;
                    } else {
                        text_label = wpmfTreeOptionsModule.categories[ij].label;
                    }

                    if (wpmfTreeOptionsModule.categories[ij].id === 0) {
                        content += '<input id="wpmf_watermark_exclude_folders_0" class="wpmf_watermark_exclude_folders" type="checkbox" value="root">';
                    } else {
                        content += '<input id="wpmf_watermark_exclude_folders_' + wpmfTreeOptionsModule.categories[ij].id + '" class="wpmf_watermark_exclude_folders" type="checkbox" value="' + wpmfTreeOptionsModule.categories[ij].id + '">';
                    }

                    content += '<label for="wpmf_watermark_exclude_folders_' + wpmfTreeOptionsModule.categories[ij].id + '" onclick="wpmfWatermarkTreeOptionsModule.changeFolder(' + wpmfTreeOptionsModule.categories[ij].id + ')">';
                    content += '<i class="material-icons" style="' + bgcolor + '">folder</i>';
                    content += text_label;
                    content += '</label>';
                    content += '</div>';
                    // This is the end of the array
                    if (wpmfTreeOptionsModule.categories[ij + 1] === undefined) {
                        // var's close all opened tags
                        for (var ik = wpmfTreeOptionsModule.categories[ij].depth; ik >= 0; ik--) {
                            content += '</li>';
                            content += '</ul>';
                        }

                        // We are at the end don't continue to process array
                        return false;
                    }


                    if (wpmfTreeOptionsModule.categories[ij + 1].depth > wpmfTreeOptionsModule.categories[ij].depth) { // The next element is a sub folder
                        // Recursively list it
                        ij++;
                        if (generateList() === false) {
                            // We have reached the end, var's recursively end
                            return false;
                        }
                    } else if (wpmfTreeOptionsModule.categories[ij + 1].depth < wpmfTreeOptionsModule.categories[ij].depth) { // The next element don't have the same parent
                        // var's close opened tags
                        for (var ik1 = wpmfTreeOptionsModule.categories[ij].depth; ik1 > wpmfTreeOptionsModule.categories[ij + 1].depth; ik1--) {
                            content += '</li>';
                            content += '</ul>';
                        }

                        // We're not at the end of the array var's continue processing it
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
         * Change the selected folder in tree view
         * @param folder_id
         */
        changeFolder: function (folder_id) {
            // Remove previous selection
            wpmfWatermarkTreeOptionsModule.getTreeElement().find('li').removeClass('selected');

            // Select the folder
            wpmfWatermarkTreeOptionsModule.getTreeElement().find('li[data-id="' + folder_id + '"]').addClass('selected').// Open parent folders
                parents('.wpmf-folder-tree li.closed').removeClass('closed');

            if (parseInt(folder_id) === 0) {
                if ($('#wpmf_watermark_exclude_folders_0').is(':checked')) {
                    $('.watermark_exclude_folders li input:not(#wpmf_watermark_exclude_folders_0)').prop('checked', false);
                } else {
                    $('.watermark_exclude_folders li input:not(#wpmf_watermark_exclude_folders_0)').prop('checked', true);
                }
            } else {
                if ($('#wpmf_watermark_exclude_folders_' + folder_id).is(':checked')) {
                    $('.watermark_exclude_folders li[data-id="'+ folder_id +'"]').find('ul li input').prop('checked', false);
                } else {
                    $('.watermark_exclude_folders li[data-id="'+ folder_id +'"]').find('ul li input').prop('checked', true);
                }
            }
        },

        /**
         * Toggle the open / closed state of a folder
         * @param folder_id
         */
        toggle: function (folder_id) {
            // Check is folder has closed class
            if (wpmfWatermarkTreeOptionsModule.getTreeElement().find('li[data-id="' + folder_id + '"]').hasClass('closed')) {
                // Open the folder
                wpmfWatermarkTreeOptionsModule.openFolder(folder_id);
            } else {
                // Close the folder
                wpmfWatermarkTreeOptionsModule.closeFolder(folder_id);
                // close all sub folder
                wpmfFeatureImageTreeOptionsModule.getTreeElement().find('li[data-id="' + folder_id + '"]').find('li').addClass('closed');
            }
        },


        /**
         * Open a folder to show children
         */
        openFolder: function (folder_id) {
            wpmfWatermarkTreeOptionsModule.getTreeElement().find('li[data-id="' + folder_id + '"]').removeClass('closed');
            wpmfWatermarkTreeOptionsModule.folders_states[folder_id] = 'open';
        },

        /**
         * Close a folder and hide children
         */
        closeFolder: function (folder_id) {
            wpmfWatermarkTreeOptionsModule.getTreeElement().find('li[data-id="' + folder_id + '"]').addClass('closed');
            wpmfWatermarkTreeOptionsModule.folders_states[folder_id] = 'close';
        }
    };

    wpmfFeatureImageTreeOptionsModule = {
        categories: [], // categories
        folders_states: [], // Contains open or closed status of folders
        element: '',

        /**
         * Retrieve the Jquery tree view element
         * of the current frame
         * @return jQuery
         */
        getTreeElement: function () {
            var element = wpmfFeatureImageTreeOptionsModule.element;
            return $(element).find('.wpmf-folder-tree');
        },

        /**
         * Initialize module related things
         */
        initModule: function (element) {
            wpmfFeatureImageTreeOptionsModule.element = element;
            // Add the tree view to the main content
            $('<div class="wpmf-folder-tree"></div>').appendTo($(element));

            // Render the tree view
            wpmfFeatureImageTreeOptionsModule.loadTreeView();
        },

        /**
         * Render tree view inside content
         */
        loadTreeView: function (element) {
            var folder_id = $('.feature_image_folders').data('value');
            wpmfFeatureImageTreeOptionsModule.getTreeElement(element).html(wpmfFeatureImageTreeOptionsModule.getRendering());
            wpmfFeatureImageTreeOptionsModule.getTreeElement().find('li[data-id="' + folder_id + '"]').parents('li').removeClass('closed');
        },

        /**
         * Get the html resulting tree view
         * @return {string}
         */
        getRendering: function () {
            var ij = 0;
            var content = ''; // Final tree view content
            var featured_image_folder = $('.feature_image_folders').data('value');
            /**
             * Recursively print list of folders
             * @return {boolean}
             */
            var generateList = function generateList() {
                content += '<ul>';
                while (ij < wpmfTreeOptionsModule.categories.length) {
                    if (typeof wpmfTreeOptionsModule.categories[ij].drive_type !== "undefined" && wpmfTreeOptionsModule.categories[ij].drive_type !== '') {
                        ij++;
                        continue;
                    }
                    var className = 'closed';
                    // Open li tag
                    content += '<li class="' + className + '" data-id="' + wpmfTreeOptionsModule.categories[ij].id + '" >';

                    // get color folder
                    var bgcolor = '';
                    if (typeof wpmf.vars.colors !== 'undefined' && typeof wpmf.vars.colors[wpmfTreeOptionsModule.categories[ij].id] !== 'undefined') {
                        bgcolor = 'color: ' + wpmf.vars.colors[wpmfTreeOptionsModule.categories[ij].id];
                    } else {
                        bgcolor = 'color: #b2b2b2';
                    }

                    var text_label = '';
                    if (wpmfTreeOptionsModule.categories[ij].id !== 0) {
                        if (wpmfTreeOptionsModule.categories[ij + 1] && wpmfTreeOptionsModule.categories[ij + 1].depth > wpmfTreeOptionsModule.categories[ij].depth) { // The next element is a sub folder
                            content += '<a onclick="wpmfFeatureImageTreeOptionsModule.toggle(' + wpmfTreeOptionsModule.categories[ij].id + ')"><i class="material-icons wpmf-arrow">keyboard_arrow_down</i></a>';
                        } else {
                            // Add folder icon
                            content += '<i class="material-icons wpmf-arrow" style="opacity: 0">keyboard_arrow_down</i></a>';
                        }
                    }

                    content += '<div class="pure-checkbox">';
                    if (wpmfTreeOptionsModule.categories[ij].id === 0) {
                        text_label = wpmf.l18n.media_folder;
                    } else {
                        text_label = wpmfTreeOptionsModule.categories[ij].label;
                    }

                    if (wpmfTreeOptionsModule.categories[ij].id !== 0) {
                        if (featured_image_folder == wpmfTreeOptionsModule.categories[ij].id) {
                            content += '<input name="featured_image_folder" id="wpmf_feature_image_folders_' + wpmfTreeOptionsModule.categories[ij].id + '" class="wpmf_feature_image_folders" type="checkbox" checked value="' + wpmfTreeOptionsModule.categories[ij].id + '">';
                        } else {
                            content += '<input name="featured_image_folder" id="wpmf_feature_image_folders_' + wpmfTreeOptionsModule.categories[ij].id + '" class="wpmf_feature_image_folders" type="checkbox" value="' + wpmfTreeOptionsModule.categories[ij].id + '">';
                        }
                    }

                    content += '<label for="wpmf_feature_image_folders_' + wpmfTreeOptionsModule.categories[ij].id + '" onclick="wpmfFeatureImageTreeOptionsModule.changeFolder(' + wpmfTreeOptionsModule.categories[ij].id + ')">';
                    content += '<i class="material-icons" style="' + bgcolor + '">folder</i>';
                    content += text_label;
                    content += '</label>';
                    content += '</div>';
                    // This is the end of the array
                    if (wpmfTreeOptionsModule.categories[ij + 1] === undefined) {
                        // var's close all opened tags
                        for (var ik = wpmfTreeOptionsModule.categories[ij].depth; ik >= 0; ik--) {
                            content += '</li>';
                            content += '</ul>';
                        }

                        // We are at the end don't continue to process array
                        return false;
                    }


                    if (wpmfTreeOptionsModule.categories[ij + 1].depth > wpmfTreeOptionsModule.categories[ij].depth) { // The next element is a sub folder
                        // Recursively list it
                        ij++;
                        if (generateList() === false) {
                            // We have reached the end, var's recursively end
                            return false;
                        }
                    } else if (wpmfTreeOptionsModule.categories[ij + 1].depth < wpmfTreeOptionsModule.categories[ij].depth) { // The next element don't have the same parent
                        // var's close opened tags
                        for (var ik1 = wpmfTreeOptionsModule.categories[ij].depth; ik1 > wpmfTreeOptionsModule.categories[ij + 1].depth; ik1--) {
                            content += '</li>';
                            content += '</ul>';
                        }

                        // We're not at the end of the array var's continue processing it
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
         * Change the selected folder in tree view
         * @param folder_id
         */
        changeFolder: function (folder_id) {
            // Select the folder
            wpmfFeatureImageTreeOptionsModule.getTreeElement().find('li[data-id="' + folder_id + '"]').// Open parent folders
                parents('.wpmf-folder-tree li.closed').removeClass('closed');

            wpmfFeatureImageTreeOptionsModule.getTreeElement().find('li input').prop('checked', false);
        },

        /**
         * Toggle the open / closed state of a folder
         * @param folder_id
         */
        toggle: function (folder_id) {
            // Check is folder has closed class
            if (wpmfFeatureImageTreeOptionsModule.getTreeElement().find('li[data-id="' + folder_id + '"]').hasClass('closed')) {
                // Open the folder
                wpmfFeatureImageTreeOptionsModule.openFolder(folder_id);
            } else {
                // Close the folder
                wpmfFeatureImageTreeOptionsModule.closeFolder(folder_id);
                // close all sub folder
                wpmfFeatureImageTreeOptionsModule.getTreeElement().find('li[data-id="' + folder_id + '"]').find('li').addClass('closed');
            }
        },


        /**
         * Open a folder to show children
         */
        openFolder: function (folder_id) {
            wpmfFeatureImageTreeOptionsModule.getTreeElement().find('li[data-id="' + folder_id + '"]').removeClass('closed');
            wpmfFeatureImageTreeOptionsModule.folders_states[folder_id] = 'open';
        },

        /**
         * Close a folder and hide children
         */
        closeFolder: function (folder_id) {
            wpmfFeatureImageTreeOptionsModule.getTreeElement().find('li[data-id="' + folder_id + '"]').addClass('closed');
            wpmfFeatureImageTreeOptionsModule.folders_states[folder_id] = 'close';
        }
    };

    /**
     * Import category
     * @param doit true or false
     * @param button
     */
    var importWpmfTaxo = function (doit, button) {
        jQuery(button).closest('div').find('.spinner').show().css('visibility', 'visible');
        $.ajax({
            type: "POST",
            url: ajaxurl,
            data: {
                action: "import_categories",
                doit: doit,
                wpmf_nonce: wpmfoption.vars.wpmf_nonce
            },
            success: function () {
                jQuery(button).closest('div').find('.spinner').hide();
            }
        });
    };

    var removeSyncItems = function (list) {
        if (!list.length) {
            return;
        }
        $.ajax({
            type: "POST",
            url: ajaxurl,
            dataType: 'json',
            data: {
                action: "wpmf_remove_syncmedia",
                key: list.toString(),
                wpmf_nonce: wpmfoption.vars.wpmf_nonce
            },
            success: function (response) {
                if (response !== false) {
                    $.each(response, function (i, v) {
                        $('.wp-list-table-sync').find('tr[data-id="' + v + '"]').remove();
                    });
                }
            }
        });
    };

    var syncItemsEvent = function () {
        /**
         * Remove list syng media
         */
        $('.btn_deletesync_media').on('click', function () {
            var list = [];
            $('[id^="cb-select-"]:checked').each(function (i, $this) {
                if ($($this).val() !== "on") {
                    list.push($($this).val());
                }
            });

            removeSyncItems(list);
        });

        $('.delete-syncftp-item').on('click', function () {
            var list = [];
            list.push($(this).closest('tr').data('id'));
            removeSyncItems(list);
        });

        $('.add-syncftp-queue').on('click', function () {
            var $this = $(this);
            var directory = $this.closest('tr').data('ftp');
            var folder_id = $this.closest('tr').data('id');
            $.ajax({
                type: "POST",
                url: ajaxurl,
                dataType: 'json',
                data: {
                    action: "wpmf_add_syncftp_queue",
                    directory: directory,
                    folder_id: folder_id,
                    wpmf_nonce: wpmfoption.vars.wpmf_nonce
                },
                beforeSend: function() {
                    $this.find('.wpmf_spinner').show();
                },
                success: function (response) {
                    $this.find('.wpmf_spinner').hide();
                    if (!response.status) {
                        alert(response.msg);
                    }
                }
            });
        });

        /**
         * check all list sync media
         */
        $('#cb-select-all-sync-items, .check-sync-item').on('click', function () {
            if ($(this).hasClass('cb-select-all-sync-items')) {
                if ($(this).is(':checked')) {
                    $('.wp-list-table-sync').find('[id^="cb-select-"]').prop('checked', true);
                } else {
                    $('.wp-list-table-sync').find('[id^="cb-select-"]').prop('checked', false);
                }
            }

            if (!$('.check-sync-item:checked').length) {
                $('.btn_deletesync_media').hide();
            } else {
                $('.btn_deletesync_media').show();
            }
        });
    };

    var mediaFilterAction = function () {
        /**
         * Add custom weight in settings
         */
        $('#add_weight').unbind('click').bind('click', function () {
            if (($('.wpmf_min_weight').val() === '') || ($('.wpmf_min_weight').val() === '' && $('.wpmf_max_weight').val() === '')) {
                $('.wpmf_min_weight').focus();
            } else if ($('.wpmf_max_weight').val() === '') {
                $('.wpmf_max_weight').focus();
            } else {
                $.ajax({
                    type: 'POST',
                    url: ajaxurl,
                    data: {
                        action: "wpmf_add_weight",
                        min_weight: $('.wpmf_min_weight').val(),
                        max_weight: $('.wpmf_max_weight').val(),
                        unit: $('.wpmfunit').val(),
                        wpmf_nonce: wpmfoption.vars.wpmf_nonce
                    },
                    success: function (res) {
                        if (res !== false) {
                            var new_weight = '<li class="wpmf_width_100 ju-settings-option customize-control customize-control-select item_weight" style="display: list-item;" data-value="' + res.key + '" data-unit="kB">';
                            new_weight += '<div class="wpmf_row_full">';
                            new_weight += '<div class="pure-checkbox ju-setting-label">';
                            new_weight += '<input title="" id="' + res.key + ',' + res.unit + '" type="checkbox" name="weight[]" value="' + res.key + ',' + res.unit + '" data-unit="kB">';
                            new_weight += '<label class="lb" for="' + res.key + ',' + res.unit + '">';
                            new_weight += res.label + '</label>';
                            new_weight += '<label class="ju-switch-button">';
                            new_weight += '<i class="material-icons wpmf-md-edit" data-label="weight" data-value="' + res.key + '" data-unit="' + res.unit + '" title="Edit weight">border_color</i>';
                            new_weight += '<i class="material-icons wpmf-delete" data-label="weight" data-value="' + res.key + '" data-unit="' + res.unit + '" title="Remove weight">delete_outline</i>';
                            new_weight += '</label>';
                            new_weight += '</div>';
                            new_weight += '</div>';
                            new_weight += '</li>';
                            $('.content_list_fillweight li.weight').before(new_weight);
                            mediaFilterAction();
                        } else {
                            alert(wpmfoption.l18n.error);
                        }
                        $('li.weight input').val(null);
                        $('.wpmfunit option[value="kB"]').prop('selected', true).change();
                    }
                });
            }
        });

        /**
         * Add custom dimension in settings
         */
        $('.add_dimension').unbind('click').bind('click', function () {
            var $this = $(this);
            var name = '';
            if ($this.closest('li').find('.wpmf_size_name').length) {
                name = $this.closest('li').find('.wpmf_size_name').val()
            }
            var width = $this.closest('li').find('.wpmf_width_dimension').val();
            var height = $this.closest('li').find('.wpmf_height_dimension').val();
            var type = $this.data('type');
            if (width != '' && height != '') {
                $.ajax({
                    type: 'POST',
                    url: ajaxurl,
                    data: {
                        action: "wpmf_add_dimension",
                        name: name,
                        width_dimension: width,
                        height_dimension: height,
                        type: type,
                        wpmf_nonce: wpmfoption.vars.wpmf_nonce
                    },
                    success: function (res) {
                        if (res !== false) {
                            var new_dimension = '<li class="wpmf_width_100 ju-settings-option customize-control customize-control-select item_dimension" style="display: list-item;" data-value="' + res + '" data-type="'+ ((type === 'photograper') ? 'photograper' : 'default') +'">';
                            new_dimension += '<div class="wpmf_row_full">';
                            new_dimension += '<div class="pure-checkbox ju-setting-label">';
                            if (type === 'photograper') {
                                new_dimension += '<input title="" id="photograper_' + res + '" type="checkbox" name="photograper_dimension[]" value="' + res + '">';
                                new_dimension += '<label class="lb" for="photograper_' + res + '">' + name + ' (' + res + ')</label>';
                            } else {
                                new_dimension += '<input title="" id="' + res + '" type="checkbox" name="dimension[]" value="' + res + '">';
                                new_dimension += '<label class="lb" for="' + res + '">' + res + '</label>';
                            }


                            new_dimension += '<label class="ju-switch-button">';
                            new_dimension += '<i class="material-icons wpmf-md-edit" data-name="'+ name +'" data-label="dimension" data-value="' + res + '" title="Edit dimension">border_color</i>';
                            new_dimension += '<i class="material-icons wpmf-delete" data-label="dimension" data-value="' + res + '" title="Remove dimension">delete_outline</i>';
                            new_dimension += '</label>';
                            new_dimension += '</div>';
                            new_dimension += '</div>';
                            new_dimension += '</li>';

                            $this.closest('.content_list_filldimension').find('li.item_dimension[data-value="full"]').before(new_dimension);
                            mediaFilterAction();
                        } else {
                            alert(wpmfoption.l18n.error);
                        }
                        $this.closest('.content_list_filldimension').find('li.dimension input').val('');
                    }
                });
            }
        });

        /**
         * remove custom weight/dimension in settings
         */
        $('.wpmf-delete').unbind('click').bind('click', function () {
            var $this = $(this);
            var type = $this.closest('li').data('type');
            var value = $this.data('value');
            var label = $this.data('label');
            var unit = $this.data('unit');
            if (label === 'dimension') {
                var action = 'wpmf_remove_dimension';
            } else {
                action = 'wpmf_remove_weight';
            }

            $.ajax({
                type: 'POST',
                url: ajaxurl,
                data: {
                    action: action,
                    type: type,
                    value: value,
                    unit: unit,
                    wpmf_nonce: wpmfoption.vars.wpmf_nonce
                },
                success: function (res) {
                    if (res === true) {
                        $this.closest('li').remove();
                    }
                }
            });
        });

        /**
         * edit custom weight/dimension in settings
         */
        $('.wpmfedit').unbind('click').bind('click', function () {
            var $this = $(this);
            var type = $this.data('type');
            var label = $this.data('label');
            var current_value = $this.closest('ul').find('.edit_' + label + '').data('value');
            var unit = $('.wpmfunit').val();

            var name = '';
            if ($this.closest('ul').find('li.dimension .wpmf_size_name').length) {
                name = $this.closest('ul').find('li.dimension .wpmf_size_name').val();
            }

            var width = $this.closest('ul').find('li.dimension .wpmf_width_dimension').val();
            var height = $this.closest('ul').find('li.dimension .wpmf_height_dimension').val();

            var new_value = '';
            if (label === 'dimension') {
                new_value = width + 'x' + height;
            } else {
                if (unit === 'kB') {
                    new_value = ($('.wpmf_min_weight').val() * 1024) + '-' + ($('.wpmf_max_weight').val() * 1024) + ',' + unit;
                } else {
                    new_value = ($('.wpmf_min_weight').val() * (1024 * 1024)) + '-' + ($('.wpmf_max_weight').val() * (1024 * 1024)) + ',' + unit;
                }
            }

            $.ajax({
                type: 'POST',
                url: ajaxurl,
                data: {
                    action: 'wpmf_edit',
                    label: label,
                    old_value: $this.data('value'),
                    new_value: new_value,
                    name: name,
                    unit: unit,
                    type: type,
                    wpmf_nonce: wpmfoption.vars.wpmf_nonce
                },
                success: function (res) {
                    if (res !== false) {
                        if (label === 'dimension') {
                            $('li.item_' + label + '[data-value="' + current_value + '"]').find('.wpmf-delete').attr('data-value', res.value).data('value', res.value);
                            $('li.item_' + label + '[data-value="' + current_value + '"]').find('.wpmf-md-edit').attr('data-value', res.value).data('value', res.value);
                            $('li.item_' + label + '[data-value="' + current_value + '"]').find('.wpmf-md-edit').attr('data-name', res.name).data('name', res.name);
                            $('li.item_' + label + '[data-value="' + current_value + '"]').find('input[name="' + label + '[]"]').val(res.value);
                            if (name !== '') {
                                $this.closest('ul').find('li[data-value="' + current_value + '"]').find('.lb').html(name + ' ('+ new_value + ')');
                            } else {
                                $this.closest('ul').find('li[data-value="' + current_value + '"]').find('.lb').html(new_value);
                            }
                            $('li.item_' + label + '[data-value="' + current_value + '"]').attr('data-value', res.value).data('value', res.value);
                        } else {
                            var cur_val = current_value.split(',');
                            $('li.item_' + label + '[data-value="' + cur_val[0] + '"]').find('.wpmf-delete').attr('data-value', res.value).data('value', res.value);
                            $('li.item_' + label + '[data-value="' + cur_val[0] + '"]').find('.wpmf-md-edit').attr('data-value', res.value).data('value', res.value);
                            $('li.item_' + label + '[data-value="' + cur_val[0] + '"]').find('input[name="' + label + '[]"]').val(res.value + ',' + cur_val[1]);
                            $('.content_list_fillweight li[data-value="' + cur_val[0] + '"]').find('.lb').html(res.label);
                            $('li.item_' + label + '[data-value="' + cur_val[0] + '"]').attr('data-value', res.value).data('value', res.value);
                        }

                    } else {
                        alert(wpmfoption.l18n.error);
                    }

                    $this.closest('ul').find('.wpmf_can').hide();
                    $this.closest('ul').find('.edit_' + label).hide();
                    $this.closest('ul').find('.edit_' + label).attr('data-value', null).data('value', null);
                    $this.closest('ul').find('.add_' + label).show();
                    $this.closest('ul').find('li.' + label + ' input').val('');
                }
            });
        });

        /**
         * open form custom weight/dimension in settings
         */
        $('.wpmf-md-edit').unbind('click').bind('click', function () {
            var $this = $(this);
            var name = $this.data('name');
            var value = $this.data('value');
            var unit = $this.data('unit');
            var label = $this.data('label');
            $this.closest('ul').find('.wpmf_can').show();
            $this.closest('ul').find('.add_' + label).hide();
            if (label === 'dimension') {
                $this.closest('ul').find('.edit_' + label).show().attr('data-value', value).data('value', value);
                var value_array = value.split('x');
                $this.closest('ul').find('li.dimension .wpmf_width_dimension').val(value_array[0]);
                $this.closest('ul').find('li.dimension .wpmf_height_dimension').val(value_array[1]);
                if (typeof name !== "undefined") {
                    $this.closest('ul').find('li.dimension .wpmf_size_name').val(name);
                }
            } else {
                $('#edit_' + label + '').show().attr('data-value', value + ',' + unit).data('value', value + ',' + unit);
                value_array = value.split('-');
                if (unit === 'kB') {
                    $('.wpmf_min_weight').val(value_array[0] / 1024);
                    $('.wpmf_max_weight').val(value_array[1] / 1024);
                } else {
                    $('.wpmf_min_weight').val(value_array[0] / (1024 * 1024));
                    $('.wpmf_max_weight').val(value_array[1] / (1024 * 1024));
                }
                $('select.wpmfunit option[value="' + unit + '"]').prop('selected', true).change();
            }
        });
    };

    /**
     * Init event
     */
    var bindSelect = function () {
        syncItemsEvent();
        /* show tooltip when hover label, button */
        tippy('label[data-wpmftippy], .wpmftippy', {
            theme: 'wpmf',
            animation: 'scale',
            animateFill: false,
            maxWidth: 300,
            duration: 0,
            arrow: true,
            onShow(instance) {
                instance.popper.hidden = false;
                instance.setContent($(instance.reference).data('wpmftippy'));
            }
        });

        mediaFilterAction();
        /**
         * Add to list sync media
         */
        $('.btn_addsync_media').on('click', function () {
            var folder_ftp = $('.dir_name_ftp').val();
            var folder_category = $('.dir_name_categories').data('id_category');
            var breadcrumb = $('.dir_name_categories').val();
            $.ajax({
                type: "POST",
                url: ajaxurl,
                dataType: 'json',
                data: {
                    action: "wpmf_add_syncmedia",
                    folder_ftp: folder_ftp,
                    folder_category: folder_category,
                    folder_category_breadcrumb: breadcrumb,
                    wpmf_nonce: wpmfoption.vars.wpmf_nonce
                },
                success: function (response) {
                    if (response.status) {
                        var tr = '<tr data-ftp="'+ response.folder_ftp +'" data-id="' + response.folder_category + '">';
                        tr += '<td><input class="media_checkbox check-sync-item" id="cb-select-' + response.folder_category + '" type="checkbox" name="post[]" value="' + response.folder_category + '"></td>';
                        tr += '<td>' + response.folder_ftp + '</td>';
                        tr += '<td>' + $('.dir_name_categories').val() + '</td>';
                        tr += '<td>';
                        tr += '<button class="button ju-small-button add-syncftp-queue m-r-10" type="button">'+ wpmfoption.l18n.add_to_queue +'<span class="wpmf_spinner"></span></button>';
                        tr += '<button class="button ju-small-button delete-syncftp-item" type="button">'+ wpmfoption.l18n.delete +'</button>';
                        tr += '</td>';
                        tr += '</tr>';
                        if (!$('.wp-list-table-sync').find('tr[data-id="' + response.folder_category + '"]').length) {
                            $('.wp-list-table-sync').append(tr);
                        }

                        syncItemsEvent();
                    } else {
                        alert(response.msg);
                    }
                }
            });
        });

        /**
         * FTP Import
         */
        $('.import_ftp_button').on('click', function () {
            var $this = $(this);
            var check_only_file = document.getElementById("only_file");
            var wpmf_only_file = 0;
            if (check_only_file.checked == true){
                wpmf_only_file = 1;
            } 
            $.ajax({
                type: 'POST',
                url: ajaxurl,
                data: {
                    action: "wpmf_import_folder",
                    wpmf_only_file: wpmf_only_file,
                    wpmf_list_import: wpmf_list_import,
                    wpmf_nonce: wpmfoption.vars.wpmf_nonce
                },
                beforeSend: function () {
                    $this.find('.spinner').show().css('visibility', 'visible');
                },
                success: function (res) {
                    $this.find('.spinner').hide();
                    if (res.status) {
                        wpmfSnackbarModule.show({
                            id: 'queue_alert',
                            content: wpmfoption.l18n.queue_import_alert,
                            auto_close: true,
                            is_progress: true
                        });
                    } else {
                        if (typeof res.msg !== "undefined") {
                            alert(res.msg);
                        }
                    }
                }
            });
        });

        // export folder
        $('.export_folder').on('click', function () {
            $.ajax({
                type: 'POST',
                url: ajaxurl,
                data: {
                    action: "wpmf_export_folder",
                    wpmf_nonce: wpmfoption.vars.wpmf_nonce
                },
                success: function (res) {

                }
            });
        });

        /**
         * close form custom weight/dimension in settings
         */
        $('.wpmf_can').on('click', function () {
            var $this = $(this);
            var label = $this.data('label');
            $this.hide();

            $this.closest('ul').find('.edit_' + label).hide();
            $this.closest('ul').find('.edit_' + label).attr('data-value', '').data('value', '');
            $this.closest('ul').find('.add_' + label).show();
            $this.closest('ul').find('li.' + label + ' input').val('');
            if (label === 'weight') {
                $('.wpmfunit option[value="kB"]').prop('selected', true).change();
            }
        });

        $('.wpmf-section-title').on('click', function () {
            var title = $(this).data('title');
            if ($(this).closest('li').hasClass('open')) {
                $('.content_list_' + title + '').slideUp('fast');
                $(this).closest('li').removeClass('open');
            } else {
                $('.content_list_' + title + '').slideDown('fast');
                $(this).closest('li').addClass('open')
            }
        });

        $('.watermark_margin_unit').on('click', function () {
            $('.watermark_unit').html($(this).val());
        });

        $('.wmpf_import_category').on('click', function () {
            importWpmfTaxo(true, this);
        });

        $('.wmpf_import_rml').on('click', function () {
            var $button = $(this);
            $button.closest('div').find('.spinner').show().css('visibility', 'visible');
            $.ajax({
                type: "POST",
                url: ajaxurl,
                data: {
                    action: "import_real_media_library",
                    wpmf_nonce: wpmfoption.vars.wpmf_nonce
                },
                success: function () {
                    $button.closest('div').find('.spinner').hide();
                }
            });
        });

        /* click import nextgen gallery button */
        $('.btn_import_gallery').on('click', function () {
            var $this = $(this);
            $this.find('.spinner').show().css('visibility', 'visible');
            $.ajax({
                type: 'POST',
                url: ajaxurl,
                data: {
                    action: "import_gallery",
                    doit: true,
                    wpmf_nonce: wpmfoption.vars.wpmf_nonce
                },
                success: function (res) {
                    $this.find('.spinner').hide();
                }
            });
        });

        // set watermark exclude folders
        $('.wpmf_watermark_exclude_folders').on('click, change', function () {
            var excludes = [];
            $('.wpmf_watermark_exclude_folders').each(function (i, v) {
                var val = $(v).val();
                if ($(v).is(':checked')) {
                    excludes.push(val);
                } else {
                    var index = excludes.indexOf(val);
                    if (index > -1) {
                        excludes.splice(index, 1);
                    }
                }
            });

            $('[name="wpmf_watermark_exclude_folders"]').val(excludes.join()).change();
        });
    };

    $(document).ready(function () {
        // load exclude tree folders
        wpmfTreeOptionsModule.importCategories();
        wpmfWatermarkTreeOptionsModule.initModule('.watermark_exclude_folders');
        wpmfFeatureImageTreeOptionsModule.initModule('.feature_image_folders');
        var sdir = '/';
        /**
         * options
         * @type {{root: string, showroot: string, onclick: onclick, oncheck: oncheck, usecheckboxes: boolean, expandSpeed: number, collapseSpeed: number, expandEasing: null, collapseEasing: null, canselect: boolean}}
         */
        var options = {
            'root': '/',
            'showroot': '//',
            'onclick': function (elem, type, file) {
            },
            'oncheck': function (elem, checked, type, file) {
                if (file.substring(file.length - 1) === sdir) {
                    file = file.substring(0, file.length - 1);
                }
                if (file.substring(0, 1) === sdir) {
                    file = file.substring(1, file.length);
                }
                if (checked) {
                    if (file !== "" && curFolders.indexOf(file) === -1) {
                        curFolders.push(file);
                    }
                } else {

                    if (file !== "" && !$(elem).next().hasClass('pchecked')) {
                        var temp = [];
                        for (var i = 0; i < curFolders.length; i++) {
                            var curDir = curFolders[i];
                            if (curDir.indexOf(file) !== 0) {
                                temp.push(curDir);
                            }
                        }
                        curFolders = temp;
                    } else {
                        var index = curFolders.indexOf(file);
                        if (index > -1) {
                            curFolders.splice(index, 1);
                        }
                    }
                }
            },
            'usecheckboxes': true, //can be true files dirs or false
            'expandSpeed': 500,
            'collapseSpeed': 500,
            'expandEasing': null,
            'collapseEasing': null,
            'canselect': true
        };

        /**
         * Main folder tree function for FTP import feature
         * @type {{init: init, open: open, close: close, getchecked: getchecked, getselected: getselected}}
         */
        var methods = {
            /**
             * Folder tree init
             */
            init: function () {
                $thisftp = $('#wpmf_foldertree');
                if ($thisftp === 0) {
                    return;
                }

                if (options.showroot !== '') {
                    var checkboxes = '';
                    if (options.usecheckboxes === true || options.usecheckboxes === 'dirs') {
                        checkboxes = '<input type="checkbox" /><span class="check" data-file="' + options.root + '" data-type="dir"></span>';
                    }
                    $thisftp.html('<ul class="jaofiletree"><li class="drive directory collapsed selected">' + checkboxes + '<a href="#" data-file="' + options.root + '" data-type="dir">' + options.showroot + '</a></li></ul>');
                }
                openfolderftp(options.root);
            },
            /**
             * open folder tree by dir name
             * @param dir
             */
            open: function (dir) {
                openfolderftp(dir);
            },
            /**
             * close folder tree by dir name
             * @param dir
             */
            close: function (dir) {
                closedirftp(dir);
            },
            /**
             * Get checked
             * @returns {Array}
             */
            getchecked: function () {
                var list = [];
                var ik = 0;
                $thisftp.find('input:checked + a').each(function () {
                    list[ik] = {
                        type: $(this).attr('data-type'),
                        file: $(this).attr('data-file')
                    };
                    ik++;

                    var curDir = this.file;
                    if (curDir.substring(curDir.length - 1) === sdir) {
                        curDir = curDir.substring(0, curDir.length - 1);
                    }
                    if (curDir.substring(0, 1) === sdir) {
                        curDir = curDir.substring(1, curDir.length);
                    }
                    if (curFolders.indexOf(curDir) === -1) {
                        curFolders.push(curDir);
                    }
                });
                spanCheckInit();
                return list;
            },
            /**
             * Get selected
             * @returns {Array}
             */
            getselected: function () {
                var list = [];
                var ik = 0;
                $thisftp.find('li.selected > a').each(function () {
                    list[ik] = {
                        type: $(this).attr('data-type'),
                        file: $(this).attr('data-file')
                    };
                    ik++;
                });
                return list;
            }
        };

        /**
         * open folder tree by dir name
         * @param dir dir name
         * @param callback
         */
        var openfolderftp = function (dir, callback) {
            if ($thisftp.find('a[data-file="' + dir + '"]').parent().hasClass('expanded')) {
                return;
            }

            if ($thisftp.find('a[data-file="' + dir + '"]').parent().hasClass('expanded') || $thisftp.find('a[data-file="' + dir + '"]').parent().hasClass('wait')) {
                if (typeof callback === 'function')
                    callback();
                return;
            }

            var ret;
            ret = $.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    dir: dir,
                    action: 'wpmf_get_folder',
                    wpmf_list_import: wpmf_list_import,
                    wpmf_nonce: wpmfoption.vars.wpmf_nonce
                },
                context: $thisftp,
                dataType: 'json',
                beforeSend: function () {
                    $('#wpmf_foldertree').find('a[data-file="' + dir + '"]').parent().addClass('wait');
                }
            }).done(function (datas) {

                selected_folder = dir;
                ret = '<ul class="jaofiletree" style="display: none">';
                for (var ij = 0; ij < datas.length; ij++) {
                    if (datas[ij].type === 'dir') {
                        var classe = 'directory collapsed';
                        if (datas[ij].disable) {
                            classe += ' folder_disabled';
                        } else {
                            classe += ' folder_enabled';
                        }
                        var isdir = '/';
                    } else {
                        classe = 'file ext_' + datas[ij].ext;
                        isdir = '';
                    }
                    ret += '<li class="' + classe + '">';
                    if (options.usecheckboxes === true || (options.usecheckboxes === 'dirs' && datas[ij].type === 'dir') || (options.usecheckboxes === 'files' && datas[ij].type === 'file')) {
                        if (!datas[ij].disable) {
                            ret += '<input type="checkbox" data-file="' + dir + datas[ij].file + isdir + '" data-type="' + datas[ij].type + '" />';
                        }

                        var testFolder = dir + datas[ij].file;
                        if (testFolder.substring(0, 1) === '/') {
                            testFolder = testFolder.substring(1, testFolder.length);
                        }

                        if (curFolders.indexOf(testFolder) > -1) {
                            ret += '<span class="check checked" data-file="' + dir + datas[ij].file + isdir + '" data-type="' + datas[ij].type + '"></span>';
                        } else if (datas[ij].pchecked === true) {
                            ret += '<span class="check pchecked" data-file="' + dir + datas[ij].file + isdir + '" data-type="' + datas[ij].type + '" ></span>';
                        } else {
                            ret += '<span class="check" data-file="' + dir + datas[ij].file + isdir + '" data-type="' + datas[ij].type + '" ></span>';
                        }
                    }
                    ret += '<i class="zmdi zmdi-folder tree-status-folder" data-file="' + dir + datas[ij].file + isdir + '"></i>';
                    ret += '<a href="#" data-file="' + dir + datas[ij].file + isdir + '" data-type="' + datas[ij].type + '">' + datas[ij].file + '</a>';
                    ret += '</li>';
                }
                ret += '</ul>';

                $('#wpmf_foldertree').find('a[data-file="' + dir + '"]').parent().removeClass('wait').removeClass('collapsed').addClass('expanded');
                $thisftp.find('.tree-status-folder[data-file="' + dir + '"]').removeClass('zmdi-folder').addClass('zmdi-folder-outline');
                $('#wpmf_foldertree').find('a[data-file="' + dir + '"]').after(ret);
                $('#wpmf_foldertree').find('a[data-file="' + dir + '"]').next().slideDown(options.expandSpeed, options.expandEasing,
                    function () {
                        methods.getchecked();
                        if (typeof callback === 'function')
                            callback();
                    });

                seteventsftp();
                wpmf_bindeventcheckbox($thisftp);
                if (options.usecheckboxes) {
                    this.find('a[data-file="' + dir + '"]').parent().find('li input[type="checkbox"]').attr('checked', null);
                    for (ij = 0; ij < datas.length; ij++) {
                        testFolder = dir + datas[ij].file;
                        if (testFolder.substring(0, 1) === '/') {
                            testFolder = testFolder.substring(1, testFolder.length);
                        }
                        if (curFolders.indexOf(testFolder) > -1) {
                            this.find('input[data-file="' + dir + datas[ij].file + isdir + '"]').attr('checked', 'checked');
                        }
                    }

                    if (this.find('input[data-file="' + dir + '"]').is(':checked')) {
                        this.find('input[data-file="' + dir + '"]').parent().find('li input[type="checkbox"]').each(function () {
                            $(this).prop('checked', true).trigger('change');
                        });
                        this.find('input[data-file="' + dir + '"]').parent().find('li span.check').addClass("checked");
                    }

                }


            }).done(function () {
                methods.getchecked();
            });

            wpmf_bindeventcheckbox($thisftp);
        };

        /**
         * remember checkbox
         * @param $thisftp
         */
        var wpmf_bindeventcheckbox = function ($thisftp) {
            $thisftp.find('li input[type="checkbox"]').bind('change', function () {
                var dir_checked = [];
                $('.directory span.check').each(function () {
                    if ($(this).hasClass('checked')) {
                        if ($(this).data('file') !== undefined) {
                            dir_checked.push($(this).data('file'));
                        }
                    }
                });

                var fchecked = [];
                fchecked.sort();
                for (var i = 0; i < dir_checked.length; i++) {
                    var curDir = dir_checked[i];
                    var valid = true;
                    for (var j = 0; j < i; j++) {
                        if (curDir.indexOf(dir_checked[j]) === 0) {
                            valid = false;
                        }
                    }
                    if (valid) {
                        fchecked.push(curDir);
                    }
                }

                wpmf_list_import = fchecked.toString();
            });
        };

        /**
         * close folder tree by dir name
         * @param dir
         */
        var closedirftp = function (dir) {
            $thisftp.find('a[data-file="' + dir + '"]').next().slideUp(options.collapseSpeed, options.collapseEasing, function () {
                $(this).remove();
            });
            $thisftp.find('a[data-file="' + dir + '"]').parent().removeClass('expanded').addClass('collapsed');
            $thisftp.find('.tree-status-folder[data-file="' + dir + '"]').addClass('zmdi-folder').removeClass('zmdi-folder-outline');
            seteventsftp();
        };

        /**
         * init event click to open/close folder tree
         */
        var seteventsftp = function () {
            $thisftp = $('#wpmf_foldertree');
            $thisftp.find('li a').unbind('click');
            //Bind userdefined function on click an element
            $thisftp.find('li a').bind('click', function () {
                options.onclick(this, $(this).attr('data-type'), $(this).attr('data-file'));
                if (options.usecheckboxes && $(this).attr('data-type') === 'file') {
                    $thisftp.find('li input[type="checkbox"]').attr('checked', null);
                    $(this).prev(':not(:disabled)').attr('checked', 'checked');
                    $(this).prev(':not(:disabled)').trigger('check');
                }
                if (options.canselect) {
                    $thisftp.find('li').removeClass('selected');
                    $(this).parent().addClass('selected');
                }
                return false;
            });
            //Bind checkbox check/uncheck
            $thisftp.find('li input[type="checkbox"]').bind('change', function () {
                options.oncheck(this, $(this).is(':checked'), $(this).next().attr('data-type'), $(this).next().attr('data-file'));
                if ($(this).is(':checked')) {
                    $(this).parent().find('li input[type="checkbox"]').attr('checked', 'checked');
                    $thisftp.trigger('check');
                } else {
                    $(this).parent().find('li input[type="checkbox"]').attr('checked', null);
                    $thisftp.trigger('uncheck');
                }

            });
            //Bind for collapse or expand elements
            $thisftp.find('li.directory.collapsed a').bind('click', function () {
                methods.open($(this).attr('data-file'));
                return false;
            });
            $thisftp.find('li.directory.expanded a').bind('click', function () {
                methods.close($(this).attr('data-file'));
                return false;
            });
        };

        /**
         * Folder tree function
         */
        methods.init();
        var spanCheckInit = function () {
            $("#wpmf_foldertree span.check").unbind('click').bind('click', function () {
                if ($(this).closest('li').hasClass('folder_disabled')) {
                    return;
                }
                $(this).removeClass('pchecked');
                $(this).toggleClass('checked');
                if ($(this).hasClass('checked')) {
                    $(this).prev().prop('checked', true).trigger('change');
                } else {
                    $(this).prev().prop('checked', false).trigger('change');
                }
                setParentState(this);
                setChildrenState(this);
            });
        };

        var setParentState = function (obj) {
            var liObj = $(obj).parent().parent();
            var noCheck = 0, noUncheck = 0, totalEl = 0;
            liObj.find('li span.check').each(function () {

                if ($(this).hasClass('checked')) {
                    noCheck++;
                } else {
                    noUncheck++;
                }
                totalEl++;
            });

            if (parseInt(totalEl) === parseInt(noCheck)) {
                liObj.parent().children('span.check').addClass('pchecked');
                liObj.parent().children('input[type="checkbox"]').prop('checked', true).trigger('change');
            } else if (parseInt(totalEl) === parseInt(noUncheck)) {
                liObj.parent().children('span.check').removeClass('pchecked');
                liObj.parent().children('input[type="checkbox"]').prop('checked', false).trigger('change');
            } else {
                liObj.parent().children('span.check').addClass('pchecked');
                liObj.parent().children('input[type="checkbox"]').prop('checked', false).trigger('change');
            }

            if (liObj.parent().children('span.check').length > 0) {
                setParentState(liObj.parent().children('span.check'));
            }
        };

        var setChildrenState = function (obj) {
            if ($(obj).hasClass('checked')) {
                $(obj).parent().find('li span.check').removeClass('pchecked').addClass("checked");
                $(obj).parent().find('li input[type="checkbox"]').prop('checked', true).trigger('change');
            } else {
                $(obj).parent().find('li span.check').removeClass("checked");
                $(obj).parent().find('li input[type="checkbox"]').prop('checked', false).trigger('change');
            }
        };

        bindSelect();

        var photograperRegeneration = function (paged) {
            if (!status_regenthumbs_photograper) {
                return;
            }
            var $button = $('.wpmf_photograper_regeneration');
            $.ajax({
                url: ajaxurl,
                method: 'POST',
                dataType: 'json',
                data: {
                    action: 'wpmf_photograper_regeneration',
                    paged: paged,
                    wpmf_nonce: wpmfoption.vars.wpmf_nonce
                },
                beforeSend: function () {
                    $button.closest('div').find('.spinner').show().css('visibility', 'visible');
                },
                success: function (res) {
                    if (res.status) {
                        if (res.continue) {
                            current_page_photograper = parseInt(paged) + 1;
                            photograperRegeneration(current_page_photograper);
                        } else {
                            $button.closest('div').find('.spinner').hide();
                        }
                    } else {
                        $button.closest('div').find('.spinner').hide();
                    }
                }
            });
        };

        /**
         * run watermark images
         * @param paged
         */
        var watermarkRegeneration = function (paged) {
            if (!status_regenthumbs_watermark) {
                return;
            }
            var $button = $('.wpmf_watermark_regeneration');
            $button.closest('div').find('.process_watermark_thumb_full').show();
            $.ajax({
                url: ajaxurl,
                method: 'POST',
                dataType: 'json',
                data: {
                    action: 'wpmf_watermark_regeneration',
                    paged: paged,
                    wpmf_nonce: wpmfoption.vars.wpmf_nonce
                },
                success: function (res) {
                    var w = $('.process_watermark_thumb').data('w');
                    if (res.status === 'ok') {
                        current_page_watermark = 1;
                        $button.html(wpmfoption.l18n.regenerate_watermark_lb).show();
                        $button.closest('div').find('.process_watermark_thumb').data('w', 0).css('width', '100%');
                        $button.show();
                        $button.closest('div').find('.btn_stop_watermark').hide();
                    }

                    if (res.status === 'limit' || typeof res === "undefined") {
                        current_page_watermark = parseInt(paged) + 1;
                        if (typeof res.percent !== "undefined") {
                            var new_w = parseFloat(w) + parseFloat(res.percent);
                            if (new_w > 100)
                                new_w = 100;
                            $button.closest('div').find('.process_watermark_thumb_full').show();
                            $button.closest('div').find('.process_watermark_thumb').data('w', new_w).css('width', new_w + '%');
                        }
                        watermarkRegeneration(current_page_watermark);
                    } else {
                        $button.closest('div').find('.process_watermark_thumb_full').hide();
                    }
                }
            });
        };

        var renderWpGalleryShortcode = function() {
            var renderShortCode = '[wpmf_gallery wpmf_autoinsert="1"';
            $('.wp_gallery_shortcode_field').each(function(){
                var param, value = '';
                if ($(this).hasClass('wp_shortcode_gallery_folder_id')) {
                    param = 'wpmf_folder_id';
                } else {
                    param = $(this).data('param');
                }

                if (param === 'autoplay') {
                    if($('[name="wpmf_gallery_shortcode_cf[autoplay]"]:checked').length) {
                        value = 1;
                    } else {
                        value = 0;
                    }
                } else if(param === 'include_children') {
                    if($('[name="wpmf_gallery_shortcode_cf[include_children]"]:checked').length) {
                        value = 1;
                    } else {
                        value = 0;
                    }
                } else if(param === 'crop_image') {
                    if($('[name="wpmf_gallery_shortcode_cf[crop_image]"]:checked').length) {
                        value = 1;
                    } else {
                        value = 0;
                    }
                } else {
                    value = $(this).val();
                }

                renderShortCode += ' ' + param + '="' + value + '"';
            });
            renderShortCode += ']';
            $('.wp_gallery_shortcode_input').val(renderShortCode);
        };

        jQuery('[name="wpmf_gallery_shortcode_cf[border_color]"]').wpColorPicker({
            // a callback to fire whenever the color changes to a valid color
            change: function(event, ui){
                $('[name="wpmf_gallery_shortcode_cf[border_color]').val(ui.color.toString()).change();
            },
            // a callback to fire when the input is emptied or an invalid color
            clear: function() {},
            // hide the color picker controls on load
            hide: true,
            // set  total width
            width : 200,
        });

        /**
         * Change gallery params in shortcode settings
         */
        $('.wp_gallery_shortcode_field').on('change',function(){
            renderWpGalleryShortcode();
        });


        $('.wp_gallery_shadow_field').on('change',function(){
            var shadow_h = $('.wp_gallery_shadow_h_field').val();
            var shadow_v = $('.wp_gallery_shadow_v_field').val();
            var shadow_blur = $('.wp_gallery_shadow_blur_field').val();
            var shadow_spread = $('.wp_gallery_shadow_spread_field').val();
            var shadow_color = $('.wp_gallery_shadow_color_field').val();
            var value = shadow_h + 'px ' + shadow_v + 'px ' + shadow_blur + 'px ' + shadow_spread + 'px ' + shadow_color;
            $('[name="wpmf_gallery_shortcode_cf[img_shadow]"]').val(value).change();
        });

        jQuery('.wp_gallery_shadow_color_field').wpColorPicker({
            // a callback to fire whenever the color changes to a valid color
            change: function(event, ui){
                $('.wp_gallery_shadow_color_field').val(ui.color.toString()).change();
            },
            // a callback to fire when the input is emptied or an invalid color
            clear: function() {},
            // hide the color picker controls on load
            hide: true,
            // set  total width
            width : 200,
        });

        /**
         * Copy gallery shortcode
         */
        $('.wpmf_copy_shortcode').on('click',function () {
            var input = $(this).data('input');
            var shortcode_value = $('.' + input).val();
            if (input === 'wp_gallery_shortcode_input') {
                wpmfFoldersModule.setClipboardText(shortcode_value, wpmf.l18n.success_copy_shortcode);
            } else {
                wpmfFoldersModule.setClipboardText(shortcode_value, wpmf.l18n.success_copy);
            }
        });


        /**
         * run watermark image
         */
        $('.wpmf_watermark_regeneration').on('click', function () {
            status_regenthumbs_watermark = true;
            if (status_regenthumbs_watermark) {
                $(this).html(wpmfoption.l18n.continue).hide();
                $('.btn_stop_watermark').show();
                watermarkRegeneration(current_page_watermark);
            }
        });

        /* stop regenerate thumbnails */
        $('.btn_stop_watermark').on('click', function () {
            status_regenthumbs_watermark = false;
            $('.wpmf_watermark_regeneration').show();
            $(this).hide();
        });

        $('#wpmf_watermark_position_all').on('click', function () {
            if ($(this).is(':checked')) {
                $('.wpmf_image_watermark_apply').prop('checked', true);
            } else {
                $('.wpmf_image_watermark_apply').prop('checked', false);
            }
        });

        $('.wpmf_check_all_photograper_size').on('click', function () {
            if ($(this).is(':checked')) {
                $('.wpmf_photograper_image_watermark_apply').prop('checked', true);
            } else {
                $('.wpmf_photograper_image_watermark_apply').prop('checked', false);
            }
        });

        /**
         * Open select logo watermark
         */
        $('.wpmf_watermark_select_image').on('click', function () {
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
                $('#wpmf_watermark_image').val(attachment.url);
                $('#wpmf_watermark_image_id').val(attachment.id);
            });

            frame.open();
        });

        $('.select_default_featured_image').on('click', function () {
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
                if (typeof attachment.sizes !== "undefined" && typeof attachment.sizes.thumbnail !== "undefined") {
                    $('.featured_image_img img').attr('src', attachment.sizes.thumbnail.url);
                } else {
                    $('.featured_image_img img').attr('src', attachment.url);
                }
                $('.default_featured_image').val(attachment.id);
                $('.default_featured_image_url').val(attachment.url);
                $('.featured_image_img').removeClass('hide');
            });

            frame.open();
        });

        $('.wpmf-remove-featured-image').on('click', function () {
            $('.default_featured_image').val(0);
            $('.default_featured_image_url').val('');
            $('.featured_image_img').addClass('hide');
        });

        $('.radio_group_input').on('change', function () {
            var value = $(this).val();
            $('.radion_option_content').addClass('hide');
            $('.radion_option_content[data-option="'+ value +'"]').removeClass('hide');
        });

        /**
         * clear logo watermark
         */
        $('.wpmf_watermark_clear_image').on('click', function () {
            $('#wpmf_watermark_image').val('');
            $('#wpmf_watermark_image_id').val(0);
        });

        /**
         * run render thumbnail for photograper
         */
        $('.wpmf_photograper_regeneration').on('click', function () {
            status_regenthumbs_photograper = true;
            if (status_regenthumbs_photograper) {
                photograperRegeneration(current_page_photograper);
            }
        });

        $('.gallery-slider-animation').on('click', function () {
            $('.gallery-slider-animation').removeClass('animation_selected');
            if ($(this).data('value') === 'fade') {
                $('.img_slide').attr('src', wpmfoption.vars.image_path + 'slide.png');
            } else {
                $('.img_slide').attr('src', wpmfoption.vars.image_path + 'slide_white.png');
            }

            $('.wpmf_slider_animation').val($(this).data('value')).change();
            $(this).addClass('animation_selected');
        });

        $('.delete_all_datas').on('click', function () {
            if ($(this).is(':checked')) {
                $('.delete_all_label').addClass('show').removeClass('hide');
            } else {
                $('.delete_all_label').addClass('hide').removeClass('show');
            }
        });

        $('.wpmf-notice-dismiss').on('click', function () {
            $('.saved_infos').slideUp();
        });

        $('[name="sync_method"]').on('change', function () {
            if ($(this).val() === 'crontab') {
                $('.wpmf-crontab-url-help-wrap').addClass('show').removeClass('hide');
            } else {
                $('.wpmf-crontab-url-help-wrap').addClass('hide').removeClass('show');
            }
        });



        $('.tabs.ju-menu-tabs .tab a.link-tab').on('click', function () {
            var href = $(this).attr('href').replace(/#/g, '');
            window.location.hash='#' + href;
            setTimeout(function () {
                $('#' + href + ' ul.tabs').itabs();
            }, 100);
        });

        // JS FOR PHYSICAL FOLDERS
        $('input[name="wp-media-folder-options[auto_detect_tables]"]').change(function(element)
        {
            if (this.checked) {
                $('#table_replace').hide();
                $('.full_search').show();
            } else {
                $('#table_replace').show();
                $('.full_search').hide();
            }
        });

        $('#sync_wpmf').click(function(e){
            e.preventDefault();

            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data : {
                    action: 'wpmf_import_wpmf',
                    nonce: wpmfoption.vars.wpmf_nonce
                }
            });
            $(this).attr('disabled', 'disabled');
            $('#sync_wpmf_doing').show();
        });
        // END JS FOR PHYSICAL FOLDERS
    });
})(jQuery);