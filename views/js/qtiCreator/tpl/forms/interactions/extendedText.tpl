<div class="panel">
    <label for="format" class="spinner">{{__ "Format"}}</label>
    <span class="icon-help tooltipstered" data-tooltip="~ .tooltip-content:first" data-tooltip-theme="info"></span>
    <span class="tooltip-content">{{__ "Used to control the format of the text entered by the candidate."}}</span>
    <select name="format" class="select2" data-has-search="false">
    	{{#each formats}}
    		<option value="{{@key}}" {{#if selected}}selected="selected"{{/if}}>{{label}}</option>
    	{{/each}}
    </select>
</div>
<hr>
<div class="panel">
    <h3 class="full-width">{{__ "Contraints"}}</h3>

    <label>
        {{__ "pattern"}}
    </label>
    <span class="icon-help tooltipstered" data-tooltip="~ .tooltip-content:first" data-tooltip-theme="info"></span>
    <span class="tooltip-content">{{__ "If given, the pattern mask specifies a regular expression that the candidate's response must match in order to be considered valid"}}</span>
    <input type="text" name="patternMask" {{#if patternMask}}value={{patternaMast}}{{/if}}/>

    <label class="spinner">
        {{__ "Max length"}}
    </label>
    <span class="icon-help tooltipstered" data-tooltip="~ .tooltip-content:first" data-tooltip-theme="info"></span>
    <span class="tooltip-content">{{__ "We will use the patternMask to do this, to be compliant with the IMS standard"}}</span>
    <input type="text" data-min="0" data-increment="1" class="incrementer" name="maxLength" />

    <label class="spinner">
        {{__ "Max words"}}
    </label>
    <span class="icon-help tooltipstered" data-tooltip="~ .tooltip-content:first" data-tooltip-theme="info"></span>
    <span class="tooltip-content">{{__ "We will use the patternMask to do this, to be compliant with the IMS standard"}}</span>
    <input type="text" data-min="0" data-increment="1" class="incrementer" name="maxWords"/>
</div>
<hr>
<div class="panel">
    <h3 class="full-width">{{__ "Expectations"}}</h3>
    <label>
        {{__ "Lenght"}}
    </label>
    <input type="text" data-min="0" data-increment="1" class="incrementer" name="expectedLength" value="{{#if maxLength}}{{maxLength}}{{/if}}"/>
</div>
