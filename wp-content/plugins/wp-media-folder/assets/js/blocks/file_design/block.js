"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

(function (wpI18n, wpBlocks, wpElement, wpEditor, wpBlockEditor, wpComponents) {
    var __ = wpI18n.__;
    var Component = wpElement.Component,
        Fragment = wpElement.Fragment;
    var registerBlockType = wpBlocks.registerBlockType;
    var InspectorControls = wpBlockEditor.InspectorControls,
        MediaUpload = wpBlockEditor.MediaUpload,
        BlockControls = wpBlockEditor.BlockControls;
    var mediaUpload = wpEditor.mediaUpload;
    var PanelBody = wpComponents.PanelBody,
        SelectControl = wpComponents.SelectControl,
        ToolbarGroup = wpComponents.ToolbarGroup,
        Button = wpComponents.Button,
        IconButton = wpComponents.IconButton,
        FormFileUpload = wpComponents.FormFileUpload,
        Placeholder = wpComponents.Placeholder;

    var wpmfFileDesign = function (_Component) {
        _inherits(wpmfFileDesign, _Component);

        function wpmfFileDesign() {
            _classCallCheck(this, wpmfFileDesign);

            var _this = _possibleConstructorReturn(this, (wpmfFileDesign.__proto__ || Object.getPrototypeOf(wpmfFileDesign)).apply(this, arguments));

            _this.addFiles = _this.addFiles.bind(_this);
            _this.uploadFromFiles = _this.uploadFromFiles.bind(_this);
            return _this;
        }

        /**
         * Upload files
         */


        _createClass(wpmfFileDesign, [{
            key: "uploadFromFiles",
            value: function uploadFromFiles(event) {
                this.addFiles(event.target.files);
            }

            /**
             * Add files
             */

        }, {
            key: "addFiles",
            value: function addFiles(files) {
                var _props = this.props,
                    attributes = _props.attributes,
                    setAttributes = _props.setAttributes;

                mediaUpload({
                    filesList: files,
                    onFileChange: function onFileChange(file) {
                        if (file.length && file[0] !== null && typeof file[0].id !== "undefined") {
                            var f = {};
                            f.title = file[0].title;
                            f.mime = file[0].mime_type;
                            f.filesizeInBytes = file[0].media_details.filesize;
                            f.url = file[0].url;
                            setAttributes({
                                id: file[0].id,
                                file: f
                            });
                        }
                    }
                });
            }
        }, {
            key: "render",
            value: function render() {
                var _props2 = this.props,
                    attributes = _props2.attributes,
                    setAttributes = _props2.setAttributes,
                    className = _props2.className;
                var id = attributes.id,
                    file = attributes.file,
                    target = attributes.target,
                    cover = attributes.cover;

                var controls = React.createElement(
                    BlockControls,
                    null,
                    id !== 0 && React.createElement(
                        ToolbarGroup,
                        null,
                        React.createElement(MediaUpload, {
                            onSelect: function onSelect(file) {
                                return setAttributes({ id: file.id, file: file });
                            },
                            render: function render(_ref) {
                                var open = _ref.open;
                                return React.createElement(IconButton, {
                                    className: "components-toolbar__control",
                                    label: __('Edit File', 'wpmf'),
                                    icon: "edit",
                                    onClick: open
                                });
                            }
                        })
                    )
                );

                var mime = '';
                var size = 0;
                if (id !== 0) {
                    var mimetype = file.url.split('.');
                    var index = mimetype.length - 1;
                    if (mimetype[index].length > 10) {
                        mimetype = file.mime.split('/');
                        index = mimetype.length - 1;
                    }
                    if (typeof mimetype !== "undefined" && typeof mimetype[index] !== "undefined") {
                        mime = mimetype[index].toUpperCase();
                    }
                    if (file.filesizeInBytes < 1024 * 1024) {
                        size = file.filesizeInBytes / 1024;
                        size = size.toFixed(1);
                        size += ' kB';
                    } else if (file.filesizeInBytes > 1024 * 1024) {
                        size = file.filesizeInBytes / (1024 * 1024);
                        size = size.toFixed(1);
                        size += ' MB';
                    }
                }

                if (typeof cover === "undefined" && id == 0) {
                    return React.createElement(
                        Placeholder,
                        {
                            icon: "media-archive",
                            label: __('WPMF Media Download', 'wpmf'),
                            instructions: wpmf.l18n.media_download_desc,
                            className: className
                        },
                        React.createElement(
                            FormFileUpload,
                            {
                                islarge: "true",
                                className: "is-primary editor-media-placeholder__button wpmf_btn_upload_img",
                                onChange: this.uploadFromFiles,
                                accept: "*"
                            },
                            wpmf.l18n.upload
                        ),
                        React.createElement(MediaUpload, {
                            onSelect: function onSelect(file) {
                                return setAttributes({ id: file.id, file: file });
                            },
                            accept: "*",
                            allowedTypes: "*",
                            render: function render(_ref2) {
                                var open = _ref2.open;
                                return React.createElement(
                                    Button,
                                    {
                                        islarge: "true",
                                        className: "is-tertiary editor-media-placeholder__button wpmfLibrary",
                                        onClick: open
                                    },
                                    wpmf.l18n.media_folder
                                );
                            }
                        })
                    );
                }

                return React.createElement(
                    Fragment,
                    null,
                    typeof cover !== "undefined" && React.createElement(
                        "div",
                        { className: "wpmf-cover" },
                        React.createElement("img", { src: cover })
                    ),
                    controls,
                    typeof cover === "undefined" && id !== 0 && React.createElement(
                        "div",
                        { className: "wp-block-shortcode" },
                        React.createElement(
                            "div",
                            { className: "wpmf-file-design-block" },
                            React.createElement(
                                InspectorControls,
                                null,
                                React.createElement(
                                    PanelBody,
                                    { title: __('File Design Settings', 'wpmf') },
                                    React.createElement(SelectControl, {
                                        label: __('Target', 'wpmf'),
                                        value: target,
                                        options: [{ label: __('Same Window', 'wpmf'), value: '' }, { label: __('New Window', 'wpmf'), value: '_blank' }],
                                        onChange: function onChange(value) {
                                            return setAttributes({ target: value });
                                        }
                                    })
                                )
                            ),
                            React.createElement(
                                "div",
                                { "data-id": id },
                                React.createElement(
                                    "a",
                                    {
                                        className: "wpmf-defile",
                                        href: file.url,
                                        download: true,
                                        rel: "noopener noreferrer",
                                        target: target, "data-id": id },
                                    React.createElement(
                                        "div",
                                        { className: "wpmf-defile-title" },
                                        React.createElement(
                                            "b",
                                            null,
                                            file.title
                                        )
                                    ),
                                    React.createElement(
                                        "span",
                                        { className: "wpmf-single-infos" },
                                        React.createElement(
                                            "b",
                                            null,
                                            __('Size: ', 'wpmf'),
                                            " "
                                        ),
                                        size,
                                        React.createElement(
                                            "b",
                                            null,
                                            __(' Format: ', 'wpmf'),
                                            " "
                                        )
                                    ),
                                    mime
                                )
                            )
                        )
                    )
                );
            }
        }]);

        return wpmfFileDesign;
    }(Component);

    var fileDesignAttrs = {
        id: {
            type: 'number',
            default: 0
        },
        file: {
            type: 'object',
            default: {}
        },
        target: {
            type: 'string',
            default: ''
        },
        cover: {
            type: 'string',
            source: 'attribute',
            selector: 'img',
            attribute: 'src'
        }
    };

    registerBlockType('wpmf/filedesign', {
        title: __('WPMF Media Download', 'wpmf'),
        icon: 'media-archive',
        category: 'wp-media-folder',
        example: {
            attributes: {
                cover: wpmf_filedesign_blocks.vars.block_cover
            }
        },
        attributes: fileDesignAttrs,
        edit: wpmfFileDesign,
        save: function save(_ref3) {
            var attributes = _ref3.attributes;
            var id = attributes.id,
                file = attributes.file,
                target = attributes.target;


            var mime = '';
            var size = 0;
            if (id !== 0) {
                var mimetype = file.url.split('.');
                var index = mimetype.length - 1;
                if (mimetype[index].length > 10) {
                    mimetype = file.mime.split('/');
                    index = mimetype.length - 1;
                }
                if (typeof mimetype !== "undefined" && typeof mimetype[index] !== "undefined") {
                    mime = mimetype[index].toUpperCase();
                }
                if (file.filesizeInBytes < 1024 * 1024) {
                    size = file.filesizeInBytes / 1024;
                    size = size.toFixed(1);
                    size += ' kB';
                } else if (file.filesizeInBytes > 1024 * 1024) {
                    size = file.filesizeInBytes / (1024 * 1024);
                    size = size.toFixed(1);
                    size += ' MB';
                }
            }

            return React.createElement(
                "div",
                { "data-id": id },
                React.createElement(
                    "a",
                    {
                        className: "wpmf-defile",
                        href: file.url,
                        download: true,
                        rel: "noopener noreferrer",
                        target: target, "data-id": id },
                    React.createElement(
                        "div",
                        { className: "wpmf-defile-title" },
                        React.createElement(
                            "b",
                            null,
                            file.title
                        )
                    ),
                    React.createElement(
                        "span",
                        { className: "wpmf-single-infos" },
                        React.createElement(
                            "b",
                            null,
                            __('Size: ', 'wpmf'),
                            " "
                        ),
                        size,
                        React.createElement(
                            "b",
                            null,
                            __(' Format: ', 'wpmf'),
                            " "
                        )
                    ),
                    mime
                )
            );
        },
        deprecated: [{
            attributes: fileDesignAttrs,
            save: function save(_ref4) {
                var attributes = _ref4.attributes;
                var id = attributes.id,
                    file = attributes.file,
                    target = attributes.target;


                var mime = '';
                var size = 0;
                if (id !== 0) {
                    var mimetype = file.mime.split('/');
                    if (typeof mimetype !== "undefined" && typeof mimetype[1] !== "undefined") {
                        mime = mimetype[1].toUpperCase();
                    }
                    if (file.filesizeInBytes < 1024 * 1024) {
                        size = file.filesizeInBytes / 1024;
                        size = size.toFixed(1);
                        size += ' kB';
                    } else if (file.filesizeInBytes > 1024 * 1024) {
                        size = file.filesizeInBytes / (1024 * 1024);
                        size = size.toFixed(1);
                        size += ' MB';
                    }
                }

                return React.createElement(
                    "div",
                    { "data-id": id },
                    React.createElement(
                        "a",
                        {
                            className: "wpmf-defile",
                            href: file.url,
                            download: true,
                            target: target, "data-id": id },
                        React.createElement(
                            "div",
                            { className: "wpmf-defile-title" },
                            React.createElement(
                                "b",
                                null,
                                file.title
                            )
                        ),
                        React.createElement(
                            "span",
                            { className: "wpmf-single-infos" },
                            React.createElement(
                                "b",
                                null,
                                __('Size: ', 'wpmf'),
                                " "
                            ),
                            size,
                            React.createElement(
                                "b",
                                null,
                                __(' Format: ', 'wpmf'),
                                " "
                            )
                        ),
                        mime
                    )
                );
            }
        }]
    });
})(wp.i18n, wp.blocks, wp.element, wp.editor, wp.blockEditor, wp.components);
