'use strict';

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
    var PanelBody = wpComponents.PanelBody,
        SelectControl = wpComponents.SelectControl,
        ToolbarGroup = wpComponents.ToolbarGroup,
        TextControl = wpComponents.TextControl,
        Button = wpComponents.Button,
        IconButton = wpComponents.IconButton,
        Placeholder = wpComponents.Placeholder;

    var $ = jQuery;

    var wpmfPdfEmbed = function (_Component) {
        _inherits(wpmfPdfEmbed, _Component);

        function wpmfPdfEmbed() {
            _classCallCheck(this, wpmfPdfEmbed);

            return _possibleConstructorReturn(this, (wpmfPdfEmbed.__proto__ || Object.getPrototypeOf(wpmfPdfEmbed)).apply(this, arguments));
        }

        _createClass(wpmfPdfEmbed, [{
            key: 'componentDidMount',
            value: function componentDidMount() {
                var _props = this.props,
                    attributes = _props.attributes,
                    clientId = _props.clientId;
                var id = attributes.id,
                    embed = attributes.embed,
                    target = attributes.target,
                    width = attributes.width,
                    height = attributes.height;

                this.doPdfEmbed(id, embed, target, width, height, clientId);
            }
        }, {
            key: 'componentDidUpdate',
            value: function componentDidUpdate(prevProps) {
                var _props2 = this.props,
                    attributes = _props2.attributes,
                    clientId = _props2.clientId;
                var id = attributes.id,
                    embed = attributes.embed,
                    target = attributes.target,
                    width = attributes.width,
                    height = attributes.height;

                if (attributes.embed != prevProps.attributes.embed || attributes.id != prevProps.attributes.id || attributes.width != prevProps.attributes.width || attributes.height != prevProps.attributes.height) {
                    this.doPdfEmbed(id, embed, target, width, height, clientId);
                }
            }
        }, {
            key: 'doPdfEmbed',
            value: function doPdfEmbed(id, embed, target, width, height, clientId) {
                var $container = $('#block-' + clientId + ' .wpmf_block_pdf_wrap');
                fetch(wpmf_pdf_blocks.vars.ajaxurl + ('?action=wpmf_load_pdf_embed&id=' + id + '&embed=' + embed + '&target=' + target + '&width=' + width + '&height=' + height + '&wpmf_nonce=' + wpmf_pdf_blocks.vars.wpmf_nonce)).then(function (res) {
                    return res.json();
                }).then(function (result) {
                    if (result.status) {
                        $container.html(result.html);
                        if($container.find('.wpmf-pdfemb-viewer').length) {
                            $container.find('.wpmf-pdfemb-viewer').pdfEmbedder();
                        }
                    }
                },
                // errors
                function (error) {});
            }
        }, {
            key: 'render',
            value: function render() {
                var _props3 = this.props,
                    attributes = _props3.attributes,
                    setAttributes = _props3.setAttributes,
                    className = _props3.className;
                var id = attributes.id,
                    embed = attributes.embed,
                    target = attributes.target,
                    width = attributes.width,
                    height = attributes.height;

                var controls = React.createElement(
                    BlockControls,
                    null,
                    id !== 0 && React.createElement(
                        ToolbarGroup,
                        null,
                        React.createElement(MediaUpload, {
                            onSelect: function onSelect(file) {
                                return setAttributes({ id: parseInt(file.id) });
                            },
                            accept: 'application/pdf',
                            allowedTypes: 'application/pdf',
                            render: function render(_ref) {
                                var open = _ref.open;
                                return React.createElement(IconButton, {
                                    className: 'components-toolbar__control wpmf-pdf-button',
                                    label: __('Edit', 'wpmf'),
                                    icon: 'edit',
                                    onClick: open
                                });
                            }
                        })
                    )
                );

                var pdf_shortcode = '[wpmfpdf';
                pdf_shortcode += ' id="' + id + '"';
                pdf_shortcode += ' embed="' + embed + '"';
                pdf_shortcode += ' target="' + target + '"';
                if (width !== '') {
                    pdf_shortcode += ' width="' + width + '"';
                }
                if (height !== '') {
                    pdf_shortcode += ' height="' + height + '"';
                }
                pdf_shortcode += ']';

                if (id == 0) {
                    return React.createElement(
                        Placeholder,
                        {
                            icon: 'pdf',
                            label: __('WP Media Folder PDF Embed', 'wpmf'),
                            instructions: __('Select a PDF file from your media library.', 'wpmf'),
                            className: className
                        },
                        React.createElement(MediaUpload, {
                            onSelect: function onSelect(file) {
                                return setAttributes({ id: parseInt(file.id) });
                            },
                            accept: 'application/pdf',
                            allowedTypes: 'application/pdf',
                            render: function render(_ref2) {
                                var open = _ref2.open;
                                return React.createElement(
                                    Button,
                                    {
                                        islarge: 'true',
                                        className: 'is-tertiary editor-media-placeholder__button wpmfLibrary',
                                        onClick: open
                                    },
                                    __('Add PDF', 'wpmf')
                                );
                            }
                        })
                    );
                }

                return React.createElement(
                    Fragment,
                    null,
                    React.createElement(
                        'div',
                        { className: 'wp-block-shortcode' },
                        id !== 0 && React.createElement(
                            'div',
                            { className: 'wpmf-pdf-block' },
                            React.createElement(
                                InspectorControls,
                                null,
                                React.createElement(
                                    PanelBody,
                                    { title: __('PDF Settings', 'wpmf') },
                                    React.createElement(SelectControl, {
                                        label: __('Embed', 'wpmf'),
                                        value: embed,
                                        options: [{ label: __('On', 'wpmf'), value: 1 }, { label: __('Off', 'wpmf'), value: 0 }],
                                        onChange: function onChange(value) {
                                            return setAttributes({ embed: parseInt(value) });
                                        }
                                    }),
                                    React.createElement(SelectControl, {
                                        label: __('Target', 'wpmf'),
                                        value: target,
                                        options: [{ label: __('Same Window', 'wpmf'), value: '' }, { label: __('New Window', 'wpmf'), value: '_blank' }],
                                        onChange: function onChange(value) {
                                            return setAttributes({ target: value });
                                        }
                                    }),
                                    React.createElement(TextControl, {
                                        label: __('Width', 'wpmf'),
                                        value: width,
                                        onChange: function onChange(value) {
                                            return setAttributes({ width: value });
                                        }
                                    }),
                                    React.createElement(TextControl, {
                                        className: 'wpmf_pdf_embed_shortcode_input',
                                        label: __('Height', 'wpmf'),
                                        value: height,
                                        onChange: function onChange(value) {
                                            return setAttributes({ height: value });
                                        }
                                    })
                                )
                            ),
                            React.createElement(TextControl, {
                                value: pdf_shortcode,
                                className: 'wpmf_pdf_value',
                                autoComplete: 'off',
                                readOnly: true
                            }),
                            id !== 0 && React.createElement('div', { className: 'wpmf_block_pdf_wrap' })
                        )
                    ),
                    controls
                );
            }
        }]);

        return wpmfPdfEmbed;
    }(Component);

    registerBlockType('wpmf/pdfembed', {
        title: wpmf_pdf_blocks.l18n.block_pdf_title,
        icon: 'media-code',
        category: 'wp-media-folder',
        attributes: {
            id: {
                type: 'number',
                default: 0
            },
            embed: {
                type: 'number',
                default: 1
            },
            target: {
                type: 'string',
                default: ''
            },
            width: {
                type: 'string',
                default: ''
            },
            height: {
                type: 'string',
                default: ''
            }
        },
        edit: wpmfPdfEmbed,
        save: function save(_ref3) {
            var attributes = _ref3.attributes;
            var id = attributes.id,
                embed = attributes.embed,
                target = attributes.target,
                width = attributes.width,
                height = attributes.height;

            var pdf_shortcode = '[wpmfpdf';
            pdf_shortcode += ' id="' + id + '"';
            pdf_shortcode += ' embed="' + embed + '"';
            pdf_shortcode += ' target="' + target + '"';
            if (width !== '') {
                pdf_shortcode += ' width="' + width + '"';
            }
            if (height !== '') {
                pdf_shortcode += ' height="' + height + '"';
            }
            pdf_shortcode += ']';
            return pdf_shortcode;
        }
    });
})(wp.i18n, wp.blocks, wp.element, wp.editor, wp.blockEditor, wp.components);
