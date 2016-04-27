define([
    'jquery',
    'lodash',
    'taoQtiItem/runner/qtiItemRunner',
    'json!taoQtiItem/qtiCommonRenderer/test/gapMatchInteraction/sample.json'
], function($, _, qtiItemRunner, itemData){
    'use strict';

    var debug = true; // set to true to render the interaction in a browser and interact with it
    var fixtureContainerId = (debug) ? 'outside-container' : 'item-container';
    var runner;

    module('GapMatchInteraction', {
        teardown : function(){
            if(runner && !debug){
                runner.clear();
            }
        }
    });

    QUnit.asyncTest('rendering', function (assert){

        var $container = $('#' + fixtureContainerId);

        runner = qtiItemRunner('qti', itemData)
          .on('render', function (){
              try {
                  var $choices = $('.choice-area .qti-choice');
                  var $hotSpots = $('.qti-flow-container .gapmatch-content');
                  
                  // assert is selected
                  $choices.eq(0).trigger("click");
                  assert.ok($choices.eq(0).hasClass('active'), "is active on click");
                  $hotSpots.each(function() {
                      assert.ok($(this).hasClass('empty'), "is marked empty");
                  });
                  
                  
                  $hotSpots.eq(4).trigger("click");
                  $choices.eq(1).trigger("click");
                  $hotSpots.eq(3).trigger("click");
                  $choices.eq(2).trigger("click");
                  $hotSpots.eq(2).trigger("click");
                  $choices.eq(3).trigger("click");
                  $hotSpots.eq(1).trigger("click");
                  $choices.eq(4).trigger("click");
                  $hotSpots.eq(0).trigger("click");
                  
                  assert.ok(true);
                  QUnit.start();
              } catch (err) {
                  console.log(err.message);
              }
          })
          .on('responsechange', function (response){
              $('#response-display').html(JSON.stringify(response, null, 2));
          })
          .init()
          .render($container);
    });

});