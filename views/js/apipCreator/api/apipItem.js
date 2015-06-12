/*
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2015 (original work) Open Assessment Technologies SA ;
 *
 */
define([
    'lodash',
    'jquery',
    'taoQtiItem/apipCreator/helper/parser',
    'taoQtiItem/apipCreator/helper/serializer',
    'taoQtiItem/apipCreator/api/qtiElement',
    'taoQtiItem/apipCreator/api/accessElement',
    'taoQtiItem/apipCreator/helper/jquery.xpath.min'
], function (_, $, parser, serializer, QtiElement, AccessElement) {
    'use strict';

    /**
     * Instanciate an creator api that will works on an APIP authoring model
     * 
     * @param {String} apipItemXML - the APIP-QTI item XML
     * @returns {Object}
     */
    function ApipItem(apipItemXML, options) {
        var that = this,
            inclusionOrderNode,
            accessibilityInfoNode;
        
        /*if (!options.id) {
            throw new TypeError('options.id parameter is required');
        }*/
        
        this.options = options;
        this.apipDoc = parser.parse(apipItemXML);
        this.$apipDoc = $(this.apipDoc);
        this.XMLNS = {
            'apip': 'http://www.imsglobal.org/xsd/apip/apipv1p0/imsapip_qtiv1p0',
            'xmlns' : that.apipDoc.documentElement.getAttribute('xmlns')
        };
        
        accessibilityInfoNode = that.xpath('//*:accessibilityInfo');
        if (accessibilityInfoNode.length === 0) {
            accessibilityInfoNode = that.createNode('apip', 'accessibilityInfo');
            that.xpath('//*:apipAccessibility')[0].appendChild(accessibilityInfoNode);
        } 
        
        inclusionOrderNode = that.xpath('//*:inclusionOrder');
        if (inclusionOrderNode.length === 0) {
            inclusionOrderNode = that.createNode('apip', 'inclusionOrder');
            that.xpath('//*:apipAccessibility')[0].appendChild(inclusionOrderNode);
        } 
    }

    /**
     * Get xml node by xpath. Empty array will be returned in nothing found.
     * @param {string} xpath
     * @param {object} context XML document
     * @returns {object} query result (XML collection)
     */
    ApipItem.prototype.xpath = function (xpath, context) {
        var that = this;
        if (!context) {
            context = this.apipDoc.documentElement;
        }
        return $.xpath(context, xpath, function (prefix) {
            if (that.XMLNS[prefix]) {
                return that.XMLNS[prefix];
            } else {
                return that.apipDoc.documentElement.getAttribute('xmlns');
            }
        });
    };

    /**
     * Add serial attributes to node including nested nodes.
     * @param {object} node XML node
     * @returns {object} XML node
     */
    ApipItem.prototype.addSerialAttr = function (node) {
        var that = this,
            serial;

        do {
            serial = node.localName + _.uniqueId(node.localName+'_');
        } while (that.xpath("//*[@serial='" + serial + "']").length > 0);

        if (!node.getAttribute('serial')) {
            node.setAttribute('serial', serial);
        }

        _.forEach(node.childNodes, function (childNode) {
            if (typeof childNode === 'object' && childNode.nodeType === 1) {
                that.addSerialAttr(childNode);
            }
        });

        return node;
    };

    /**
     * Create xml node
     * @param {string} namespace
     * @param {string} name node name
     * @param {object} attributes list of attributes. Example: {"id": "myId", "class": "myClass"}
     * @returns created node;
     */
    ApipItem.prototype.createNode = function (namespace, name, attributes) {
        var that = this,
            namespaceURI = that.XMLNS[namespace] ? that.XMLNS[namespace] : 'http://www.w3.org/1999/xhtml',
            node = that.apipDoc.createElementNS(namespaceURI, namespace + ":" + name);

        if (attributes) {
            _.forEach(attributes, function (val, attrName) {
                node.setAttribute(attrName, val);
            });
        }

        that.addSerialAttr(node);
        return node;
    };

    /**
     * Get a clone of the parsed item body
     * This will be used to generate the (main) item selecting view for the apip authoring tool
     * 
     * @returns {Object} XML node (<itemBody>);
     */
    ApipItem.prototype.getItemBodyModel = function getItemBodyModel() {
        return this.$apipDoc.find('itemBody').clone()[0];
    };

    /**
     * Find the qti element identified by its serial
     * 
     * @param {String} qtiElementSerial
     * @returns {Object} QtiElement instance
    */
    ApipItem.prototype.getQtiElementBySerial = function getQtiElementBySerial(qtiElementSerial) {
        var node = this.xpath("*:itemBody//*[@serial='" + qtiElementSerial + "']"),
            result = null;
        
        if (node && node.length) {
            result = new QtiElement(this, node[0]);
        }

        return result;
    };
    
    /**
     * Instanciate QtiElement object
     * 
     * @param {String} node XML node.
     * @returns {Object} QtiElement instance
    */
    ApipItem.prototype.getQtiElementInstance = function getQtiElementInstance(node) {
        return new QtiElement(this, node);
    };
    
    /**
     * Get the access element identified by its serial
     * 
     * @param {String} accessElementSerial
     * @returns {Object} AccessElement instance
     */
    ApipItem.prototype.getAccessElementBySerial = function getAccessElementBySerial(accessElementSerial) {
        return this.getAccessElementByAttr('serial', accessElementSerial);
    };

    /**
     * Get the access element by attribute name and its value. 
     * If found more than one element then array of elements will be returned. Otherwise one accessElement instance will be returned.
     * 
     * @param {String} accessElementSerial
     * @returns {Object | Array}
     */
    ApipItem.prototype.getAccessElementByAttr = function getAccessElementByAttr(attr, val) {
        var that = this,
            nodes = this.xpath("//*:accessElement[@" + attr + "='" + val + "']"),
            collection = [],
            result;

        if (nodes.length > 0) {
            _.forEach(nodes, function (node) {
                collection.push(new AccessElement(that, node));
            });
        }

        if (collection.length === 0) {
            result = null;
        } else {
            result = collection.length === 1 ? collection[0] : collection;
        }

        return result;
    };

    /**
     * Get the sorted array of accessElements referenced in the inclusion order
     * The accessElements are sorted according to the order attribute in the inclusionOrder
     * 
     * @param {String} inclusionOrderType
     * @returns {Array}
     */
    ApipItem.prototype.getAccessElementsByInclusionOrder = function getAccessElementsByInclusionOrder(inclusionOrderType) {
        var nodes = this.xpath('//*:' + inclusionOrderType + '/apip:elementOrder'),
            that = this,
            result,
            elementsList;

        elementsList = nodes.map(function (key, node) {
            var orderNode = that.xpath('*:order', node);
            return {
                accessElementIdentifier: node.getAttribute('identifierRef'),
                order : orderNode[0].innerHTML
            };
        });

        //sort by order value
        elementsList = _.sortBy(elementsList, 'order');

        result = elementsList.map(function (val) {
            return that.getAccessElementByAttr('identifier', val.accessElementIdentifier);
        });
        return result;
    };

    /**
     * Serialize the authoring model into XML for saving
     * 
     * @returns {String}
     */
    ApipItem.prototype.toXML = function toXML() {
        var apipDoc = this.apipDoc.cloneNode(true);
        $(apipDoc).find('[serial]').removeAttr('serial');
        return serializer.serialize(apipDoc);
    };
    
    /**
     * Dump the actual apipItem into a string object (for debugging)
     * 
     * @returns {String}
     */
    ApipItem.prototype.toString = function toString() {
        return serializer.serialize(this.apipDoc);
    };

    return ApipItem;
});