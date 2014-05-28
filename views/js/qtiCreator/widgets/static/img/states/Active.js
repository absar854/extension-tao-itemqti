define([
    'taoQtiItem/qtiCreator/widgets/states/factory',
    'taoQtiItem/qtiCreator/widgets/static/states/Active',
    'tpl!taoQtiItem/qtiCreator/tpl/forms/static/img',
    'taoQtiItem/qtiCreator/widgets/helpers/formElement',
    'taoQtiItem/qtiCreator/widgets/static/helpers/inline',
    'lodash',
    'util/image',
    'helpers',
    'ui/resourcemgr',
    'nouislider'
], function(stateFactory, Active, formTpl, formElement, inlineHelper, _, imageUtil, helpers){

    var ImgStateActive = stateFactory.extend(Active, function(){

        this.initForm();

    }, function(){

        this.widget.$form.empty();
    });

    var _containClass = function(allClassStr, className){
        var regex = new RegExp('(?:^|\\s)' + className + '(?:\\s|$)', '');
        return allClassStr && regex.test(allClassStr);
    };

    /**
     * Greatly throttled callback function
     * 
     * @param {jQuery} $img
     * @param {string} propertyName
     * @returns {function}
     */
    var _getImgSizeChangeCallback = function($img, propertyName){

        var _setAttr = _.debounce(function(img, value, name){
            img.attr(name, value);
        }, 1000);

        return _.throttle(function(img, value, name){
            $img[propertyName](value);
            _setAttr(img, value, name);
            $img.trigger('contentChange.qti-widget');
        }, 100);

    };

    ImgStateActive.prototype.initForm = function(){

        var _widget = this.widget,
            $img = _widget.$original,
            $form = _widget.$form,
            img = _widget.element,
            baseUrl = _widget.options.baseUrl,
            responsive = true;

        $form.html(formTpl({
            baseUrl : baseUrl || '',
            src : img.attr('src'),
            alt : img.attr('alt'),
            height : img.attr('height') || 0,
            width : img.attr('width') || 0,
            responsive : responsive
        }));

        //init slider and set align value before ...
        _initAdvanced(_widget);
        _initSlider(_widget);
        _initAlign(_widget);
        _initUpload(_widget);

        //... init standard ui widget
        formElement.initWidget($form);

        //init data change callbacks
        formElement.initDataBinding($form, img, {
            src : function(img, value){

                img.attr('src', value);

                if(!value.match(/^http/i)){
                    value = baseUrl + '/' + value;
                }
                $img.attr('src', value);

                inlineHelper.togglePlaceholder(_widget);
                _initSlider(_widget);
                _initAdvanced(_widget);
            },
            alt : formElement.getAttributeChangeCallback(),
            longdesc : formElement.getAttributeChangeCallback(),
            align : function(img, value){
                inlineHelper.positionFloat(_widget, value);
            },
            height : _getImgSizeChangeCallback($img, 'height'),
            width : _getImgSizeChangeCallback($img, 'width')
        });
    };

    var _initAlign = function(widget){

        var align = 'default';

        //init float positioning:
        if(widget.element.hasClass('rgt')){
            align = 'right';
        }else if(widget.element.hasClass('lft')){
            align = 'left';
        }

        inlineHelper.positionFloat(widget, align);
        widget.$form.find('select[name=align]').val(align);
    };

    var _initSlider = function(widget){

        var $container = widget.$container,
            $form = widget.$form,
            $slider = $form.find('.img-resizer-slider'),
            img = widget.element,
            $img = $container.find('img'),
            $height = $form.find('[name=height]'),
            $width = $form.find('[name=width]'),
            original = {
            h : img.attr('height') || $img.height(),
            w : img.attr('width') || $img.width()
        };

        $slider.noUiSlider({
            range : {
                min : 10,
                max : 200
            },
            start : 100
        }, $slider.hasClass('noUi-target'));

        $slider.off('slide').on('slide', _.throttle(function(e, value){

            var ratio = (value / 100),
                w = parseInt(ratio * original.w),
                h = parseInt(ratio * original.h);

            $width.val(w).change();
            $height.val(h).change();
        }, 100));
    };

    var _initAdvanced = function(widget){

        var $form = widget.$form,
            src = widget.element.attr('src');

        if(src){
            $form.find('[data-role=advanced]').show();
        }else{
            $form.find('[data-role=advanced]').hide();
        }
    };


    var _initUpload = function(widget){

        var $form = widget.$form,
            options = widget.options,
            $uploadTrigger = $form.find('[data-role="upload-trigger"]'),
            $src = $form.find('input[name=src]'),
            $width = $form.find('input[name=width]'),
            $height = $form.find('input[name=height]');

        $uploadTrigger.on('click', function(){
            $uploadTrigger.resourcemgr({
                appendContainer : options.mediaManager.appendContainer,
                root : '/',
                browseUrl : options.mediaManager.browseUrl,
                uploadUrl : options.mediaManager.uploadUrl,
                deleteUrl : options.mediaManager.deleteUrl,
                downloadUrl : options.mediaManager.downloadUrl,
                params : {
                    uri : options.uri,
                    lang : options.lang,
                    filters : 'image/jpeg,image/png,image/gif'
                },
                pathParam : 'path',
                select : function(e, files){
                    var i, l = files.length;
                    for(i = 0; i < l; i++){
                        imageUtil.getSize(options.baseUrl + files[i].file, function(size){
                            if(size && size.width >= 0){
                                $width.val(size.width).trigger('change');
                                $height.val(size.height).trigger('change');
                            }
                            $src.val(files[i].file).trigger('change');
                        });
                        break;
                    }
                }
            });
        });

    };

    return ImgStateActive;
});
