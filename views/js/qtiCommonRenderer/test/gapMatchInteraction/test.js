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
              assert.ok(true);
              
              QUnit.start();
          })
          .on('responsechange', function (response){
              $('#response-display').html(JSON.stringify(response, null, 2));
          })
          .init()
          .render($container);
    });

});