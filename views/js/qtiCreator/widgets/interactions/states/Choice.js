define([
    'taoQtiItem/qtiCreator/widgets/states/factory',
    'taoQtiItem/qtiCreator/widgets/states/Choice'
], function(stateFactory, Choice){

    var InteractionStateChoice = stateFactory.create(Choice, function(){
        
        var _widget = this.widget;
        
        //move to question state by clicking everywhere in the interaction but outside of the choice
        _widget.$container.on('click.choice', function(e){
            
            if(!$(e.target).closest('.qti-choice').length){
                _widget.changeState('question');
            }
        });
        
    }, function(){
        
        this.widget.$container.off('.choice');
    });

    return InteractionStateChoice;
});