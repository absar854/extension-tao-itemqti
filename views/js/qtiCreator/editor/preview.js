define([
    'jquery',
    'lodash',
    'i18n',
    'taoQtiItem/qtiCreator/helper/commonRenderer',
    'json!taoQtiItem/qtiCreator/editor/resources/device-list.json',
    'tpl!taoQtiItem/qtiCreator/tpl/preview/preview',
    'taoQtiItem/qtiCreator/editor/styleEditor/styleEditor',
    'helpers',
    'iframeResizer',
    'taoQtiItem/qtiCreator/model/helper/event',
    'ui/modal',
    'select2',
    'jquery.cookie'
], function($, _, __, commonRenderer, deviceList, previewTpl, styleEditor, helpers, iframeResizer, event) {
    'use strict'

    var overlay,
        container,
        orientation = 'landscape',
        previewType = 'desktop',
        previewTypes = {
            desktop: __('Desktop preview'),
            mobile: __('Mobile preview'),
            standard: __('Actual size')
        },
        $doc = $(document),
        $window = $(window),
        $body = $(document.body),
        screenSize = {
            width: $window.innerWidth(),
            height: $window.innerHeight()
        },
        maxDeviceSize = {
            width: 0,
            height: 0
        },
        scaleFactor = 1,
        hasBeenSavedOnce = false,
        typeDependant,
        $feedbackBox,
        previewContainerMaxWidth;



    /**
     * Create data set for device selectors
     *
     * @param type
     * @returns {Array}
     * @private
     */
    var _getDeviceSelectorData = function(type) {

        /*
         * @todo
         * The device list is currently based on the devices found on the Chrome emulator.
         * This is not ideal and should be changed in the future.
         * I have http://en.wikipedia.org/wiki/List_of_displays_by_pixel_density in mind but we
         * will need to figure what criteria to apply when generating the list.
         */
        var devices = type === 'mobile' ? deviceList['tablets'] : deviceList['screens'],
            options = [];

        _.forEach(devices, function(value) {

            // figure out the widest possible screen to calculate the scale factor
            maxDeviceSize = {
                width: Math.max(maxDeviceSize.width, value.width),
                height: Math.max(maxDeviceSize.height, value.height)
            };

            options.push({
                value: value.label,
                label: value.label,
                dataValue : [value.width, value.height].join(','),
                selected: previewType === value.label
            });
        });


        return options;
    };

    /**
     * Collect all elements that can toggle their class name between mobile-* and desktop-*
     *
     * @private
     */
    var _setupTypeDependantElements = function() {
        typeDependant = overlay.add(overlay.find('.preview-scale-container').find('[class*="' + previewType + '"]'));
    };


    /**
     * Change the class name of all type dependant elements
     *
     * @param type
     */
    var _setPreviewType = function(newType) {

        if (newType === previewType) {
            return;
        }
        var re = new RegExp(previewType, 'g');

        typeDependant.each(function() {
            this.className = this.className.replace(re, newType);
        });

        previewType = newType;
    };


    /**
     * Set orientation
     *
     * @param newOrientation
     * @private
     */
    var _setOrientation = function(newOrientation) {
        if (newOrientation === orientation) {
            return;
        }

        var re = new RegExp(orientation, 'g'),
            previewFrame = $('.preview-outer-frame')[0];

        previewFrame.className = previewFrame.className.replace(re, newOrientation);

        // reset global orientation
        orientation = newOrientation;
    };

    /**
     * Scale devices down to fit screen
     * @private
     */
    var _scale = function() {

        var $scaleContainer = $('.preview-scale-container'),
            _scaleFactor = previewType === 'standard' ? 1 : scaleFactor,
            containerScaledWidth = $scaleContainer.width() * _scaleFactor,
            left = (screenSize.width - containerScaledWidth) / 2;

        $scaleContainer.css({
            left: left,
            '-webkit-transform': 'scale(' + _scaleFactor + ',' + _scaleFactor + ')',
            '-ms-transform': 'scale(' + _scaleFactor + ',' + _scaleFactor + ')',
            'transform': 'scale(' + _scaleFactor + ',' + _scaleFactor + ')',
            '-webkit-transform-origin': '0 0',
            '-ms-transform-origin': '0 0',
            'transform-origin': '0 0'
        });


        _adaptUtilityBar();
    };

    var _adaptUtilityBar = function() {
        _computeScaleFactor();
        $('.preview-utility-bar, .preview-message-box').width(screenSize.width);
    };


    /**
     * Compute scale factor based on screen size and device size
     *
     * @private
     */
    var _computeScaleFactor = function() {

        var scaleValues = {
            x: 1,
            y: 1
        };


        // 150/200 = device frames plus toolbar plus some margin
        var requiredSize = {
            width: maxDeviceSize.width + 150,
            height: maxDeviceSize.height + 250
        };

        if (requiredSize.width > screenSize.width) {
            scaleValues.x = screenSize.width / requiredSize.width;
        }

        if (requiredSize.height > screenSize.height) {
            scaleValues.y = screenSize.height / requiredSize.height;
        }

        scaleFactor = Math.min(scaleValues.x, scaleValues.y);
    };

    /**
     * Add functionality to device selectors
     *
     * @private
     */
    var _setupDeviceSelectors = function() {



        var previewDeviceSelectors = overlay.find('.preview-device-selector');

        previewDeviceSelectors.on('change', function() {
            var elem = $(this),
                option = this.nodeName.toLowerCase() === 'select' ? this.options[this.selectedIndex] : this,
                type = elem.data('target'),
                val = $(option).data('value').split(','),
                sizeSettings,
                i = val.length,
                container = overlay.find('.' + type + '-preview-container'),
                iframe = overlay.find('.preview-iframe');


            while (i--) {
                val[i] = parseFloat(val[i]);
            }

            if (type === 'mobile' && orientation === 'portrait') {
                sizeSettings = {
                    width: val[1],
                    height: val[0]
                };
            } else {
                sizeSettings = {
                    width: val[0],
                    height: val[1]
                };
            }

            if (sizeSettings.width === container.width() && sizeSettings.height === container.height()) {
                return false;
            }
            _setPreviewType(type);
            container.css(sizeSettings);
            _scale();



        });

        previewDeviceSelectors.each(function() {
            if(this.nodeName.toLowerCase() === 'select'){
                $(this).select2({
                    minimumResultsForSearch: -1
                })
            }
        });



    };

    /**
     * Setup orientation selector. There is no actual orientation switch for desktop but it could
     * be added easily if required.
     * @private
     */
    var _setupOrientationSelectors = function() {

        $('select.orientation-selector').on('change', function() {

            var type = $(this).data('target'),
                previewFrame = $('.' + type + '-preview-frame'),
                container = previewFrame.find('.' + type + '-preview-container'),
                iframe = overlay.find('.preview-iframe'),
                sizeSettings,
                newOrientation = $(this).val();

            if (newOrientation === orientation) {
                return false;
            }

            sizeSettings = {
                height: container.width(),
                width: container.height()
            };

            container.css(sizeSettings);
            _scale();


            _setOrientation(newOrientation);

        }).select2({
            minimumResultsForSearch: -1
        });
    };

    /**
     * Close preview
     *
     * @returns {*|HTMLElement}
     */
    var _setupClosers = function() {
        var $closer = overlay.find('.preview-closer'),
            $feedbackCloser = $feedbackBox.find('.close-trigger'),
            $hideForever = $feedbackBox.find('a');

        $closer.on('click', function() {
            commonRenderer.setContext($('.item-editor-item'));
            overlay.hide();
        });

        $doc.keyup(function(e) {
            if (e.keyCode == 27) {
                $closer.trigger('click');
            }
        });

        $feedbackCloser.on('click', function() {
            $feedbackBox.hide();
        });

        $hideForever.on('click', function(e) {
            e.preventDefault();
            $.cookie('hidePreviewFeedback', true, { expires: 1000, path: '/' });
            $feedbackCloser.trigger('click');
        });
    };

    /**
     * Build options for preview types
     *
     * @returns {Array}
     * @private
     */
    var _getPreviewTypes = function() {
        var options = [];
        _(previewTypes).forEach(function(_previewLabel, _previewType) {
            options.push({
                value: _previewType,
                label: _previewLabel,
                selected: previewType === _previewType
            })
        });
        return options;
    };

    /**
     * Select preview type
     *
     * @private
     */
    var _setupViewSelector = function() {

        $('select.preview-type-selector').on('change', function() {
            var _previewType = $(this),
                value = _previewType.val();

            _setPreviewType(value);

            $('.' + value + '-device-selector').trigger('change');
        }).select2({
            minimumResultsForSearch: -1
        });

    };


    /**
     * Set the size for the standard preview
     * @param height
     * @private
     */
    var _updateStandardPreviewSize = function(height) {
        var $selector = $('.standard-device-selector'),
            values = ($selector.val() ? $selector.val().split(',') : '') || [$window.width().toString()],
            valueStr = values.join(',');

        values[1] = height || values[1] || '1200';

        $selector.val(valueStr).data('value', valueStr);
    };


    /**
     * Remove possibly existing widgets and create a new one
     *
     * @param item
     * @private
     */
    var _initWidget = function() {

        $('.preview-overlay').remove();
        container = null;
        overlay = $(previewTpl({
            mobileDevices: _getDeviceSelectorData('mobile'),
            desktopDevices: _getDeviceSelectorData('desktop'),
            previewTypes: _getPreviewTypes(),
            previewType: previewType
        }));


        $body.append(overlay);

        previewContainerMaxWidth = parseInt($('.preview-container').css('max-width'), 10);

        $feedbackBox = overlay.find('.preview-message-box');
        if($.cookie('hidePreviewFeedback')) {
            $feedbackBox.hide();
        }

        _updateStandardPreviewSize();

        _setupTypeDependantElements();

        _setupDeviceSelectors();
        _setupOrientationSelectors();
        _setupViewSelector();

        _setupClosers();

        _computeScaleFactor();

        _setPreviewType(previewType);
        _setOrientation(orientation);

        $window.on('resize orientationchange', function(e) {
            screenSize = {
                width: $window.innerWidth(),
                height: $window.innerHeight()
            };
            _updateStandardPreviewSize();
            _computeScaleFactor();
            _scale();
        });

    };

    /**
     * Confirm to save the item
     */
    var _confirmPreview = function() {

        var confirmBox = $('.preview-modal-feedback'),
            cancel = confirmBox.find('.cancel'),
            save = confirmBox.find('.save'),
            close = confirmBox.find('.modal-close');

            confirmBox.modal({ width: 500 });

        save.on('click', function() {
            hasBeenSavedOnce = true;
            overlay.trigger('save.preview');
            confirmBox.modal('close');
        });

        cancel.on('click', function() {
            confirmBox.modal('close');
        });
    };





    /**
     * Display the preview
     *
     * @private
     */
    var _showWidget = function(launcher, widget) {

        var preview = function() {


            var $iframe = $('.preview-iframe'),
                itemUri = helpers._url('index', 'QtiPreview', 'taoQtiItem') + '?uri=' + encodeURIComponent(widget.itemUri) + '&' + 'quick=1';

            iframeResizer.eventHeight($iframe);

            $iframe.attr('src', itemUri);


            $.when(styleEditor.save(), widget.save()).done(function() {

                previewType = $(launcher).data('preview-type') || 'desktop';

                overlay.show();
                overlay.height($doc.outerHeight());
                overlay.find('select:visible').trigger('change');

                _scale();
            });
            return true;
        };



        // wait for confirmation to save the item
        if(!hasBeenSavedOnce) {
            _confirmPreview();
            overlay.on('save.preview', function() {
                overlay.off('save.preview');
                return preview();
            });
        }

        else {
            return preview();
        }


    };



    $doc.on('iframeheightchange', function(e, data) {
        _updateStandardPreviewSize(data.height);
    });


    return (function($) {

        /**
         * Create preview
         *
         * @param launchers - buttons to launch preview
         * @param widget
         */
        var init = function(launchers, widget) {

            _initWidget();

            $(launchers).on('click', function() {
                _showWidget(this, widget);
            });
        };

        return {
            init: init
        }
    }($));
});