define([
    'jquery',
    'lodash',
    'taoQtiItem/qtiCreator/widgets/states/factory',
    'taoQtiItem/qtiCreator/widgets/interactions/blockInteraction/states/Question',
    'taoQtiItem/qtiCreator/widgets/helpers/formElement',
    'tpl!taoQtiItem/qtiCreator/tpl/forms/interactions/media',
    'ui/resourcemgr'
], function($, _, stateFactory, Question, formElement, formTpl) {

    var initQuestionState = function initQuestionState(){
        this.widget.renderInteraction();
    };

    var exitQuestionState = function exitQuestionState() {
        this.widget.destroyInteraction();
    };

    var MediaInteractionStateQuestion = stateFactory.extend(Question, initQuestionState, exitQuestionState);

    MediaInteractionStateQuestion.prototype.initForm = function(){
        
        var widget      = this.widget;
        var $form       = widget.$form;
        var options     = widget.options;
        var interaction = widget.element;
        var callbacks   = {};
        
        var reRender = _.throttle(function reRender(interaction) {
            xmlUpdateCheat(interaction);
            widget.destroyInteraction();
            widget.renderInteraction();
        }, 1000);
        
        var xmlUpdateCheat = function xmlUpdateCheat(interaction) {
            // xml update cheat
            interaction.attr('responseIdentifier', interaction.attr('responseIdentifier') );
        };

        //initialization binding
        //initialize your form here, you certainly gonna need to modify it:
        //append the form to the dom (this part should be almost ok)
        $form.html(formTpl({
            
            //tpl data for the interaction
            autostart : !!interaction.attr('autostart'),
            loop : !!interaction.attr('loop'),
            //minPlays : parseInt(interaction.attr('minPlays')),
            maxPlays : parseInt(interaction.attr('maxPlays')),
            
            //tpl data for the "object", this part is going to be reused by the "objectWidget", http://www.imsglobal.org/question/qtiv2p1/imsqti_infov2p1.html#element10173
            data:interaction.object.attr('data'),
            type:interaction.object.attr('type'),//use the same as the uploadInteraction, contact jerome@taotesting.com for this
            width:interaction.object.attr('width'),
            height:interaction.object.attr('height')
        }));

        formElement.initWidget($form);
        
        //init data change callbacks
        
        //callbacks.autostart = formElement.getAttributeChangeCallback();
        callbacks.autostart = function(interaction, attrValue, attrName) {
            interaction.attr(attrName, attrValue);
            reRender(interaction);
        };
        
        //callbacks.loop = formElement.getAttributeChangeCallback();
        callbacks.loop = function(interaction, attrValue, attrName) {
            interaction.attr(attrName, attrValue);
            reRender(interaction);
        };
        
        callbacks.maxPlays = function(interaction, attrValue, attrName){
            interaction.attr(attrName, attrValue);
            reRender(interaction);
        };
        
        //callbacks['width'] = formElement.getAttributeChangeCallback();
        callbacks.width = function(interaction, attrValue, attrName){
            interaction.object.attr(attrName, attrValue);
            reRender(interaction);
        };
        
        callbacks.height = function(interaction, attrValue, attrName){
            interaction.object.attr(attrName, attrValue);
            reRender(interaction);
        };
        
        callbacks.data = function(interaction, attrValue, attrName){
            if ( interaction.object.attr(attrName) !== attrValue ) {
                interaction.object.attr(attrName, attrValue);
                xmlUpdateCheat(interaction);

                var dataValue = $.trim(attrValue).toLowerCase();

                if (/^http(s)?:\/\/(www\.)?youtu/.test(dataValue)) {
                    interaction.object.attr('type', 'video/youtube');
                }

                if(interaction.object && (!interaction.object.attr('width') || parseInt(interaction.object.attr('width'), 10) <= 0)){
                    interaction.object.attr('width', widget.$original.innerWidth());
                }
                reRender(interaction);
            }
       };
        
        formElement.initDataBinding($form, interaction, callbacks, {invalidate:true});
         
        $('.selectMediaFile', $form).on('click', function() {
            
            $(this).resourcemgr({
                appendContainer : options.mediaManager.appendContainer,
                root : '/',
                browseUrl : options.mediaManager.browseUrl,
                uploadUrl : options.mediaManager.uploadUrl,
                deleteUrl : options.mediaManager.deleteUrl,
                downloadUrl : options.mediaManager.downloadUrl,
                params : {
                    uri : options.uri,
                    lang : options.lang,
                    filters : 'video/mp4,video/avi,video/ogv,video/mpeg,video/ogg,video/quicktime,video/webm,video/x-ms-wmv,video/x-flv,audio/mp3,audio/vnd.wav,audio/ogg,audio/vorbis,audio/webm,audio/mpeg'
                },
                pathParam : 'path',
                select : function(e, files){
                    if(files && files.length){ 
                        // set data field content and meybe detect and set media type here
                        interaction.object.attr('type', files[0].mime);
                        $form.find('input[name=data]')
                                .val( files[0].file )
                                .trigger('change');
                    }
                }
            });
        });
    };

    return MediaInteractionStateQuestion;
});
