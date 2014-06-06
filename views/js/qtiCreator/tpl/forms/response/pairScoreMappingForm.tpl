    <div class="form-container">
        <h1>{{title}}</h1>

        <div class="panel grid-row">
             <div class="col-3">{{leftTitle}}</div>
             <div class="col-4">{{rightTitle}}</div>
            
            <div class="col-2" data-edit="correct" {{#if defineCorrect}}style="display:block"{{/if}}>
                <span>{{__ "Correct"}}</span>
                <span class="icon-help tooltipstered" data-tooltip="~ .tooltip-content:first" data-tooltip-theme="info"></span>
                <span class="tooltip-content">{{__ 'Is this pair the correct response?'}}</span>
            </div>

            <div class="col-2">
                <span>{{__ "Score"}}</span>
                <span class="icon-help tooltipstered" data-tooltip="~ .tooltip-content:first" data-tooltip-theme="info"></span>
                <span class="tooltip-content">{{__ 'Set the score for this response'}}</span>
            </div>
            <div class="col-1"></div>
        </div>

        <hr />

        {{#each pairs}}
            {{{.}}}
        {{/each}}
    
        <div class="panel grid-row panel-new-pair">
            <h2>{{__ "New pair"}}</h2>
        </div> 
        <div class="panel grid-row">
            <div class="col-3">
                <select class="select2 new-pair-left">
                    <option></option>
                    {{#each pairLeft}}
                    <option value="{{id}}">{{{value}}}</option> 
                    {{/each}}
                </select>
             </div>
             <div class="col-3">
                <select class="select2 new-pair-right">
                    <option></option>
                    {{#each pairRight}}
                    <option value="{{id}}">{{{value}}}</option> 
                    {{/each}}
                </select>
             </div>
             <div class="col-1">
                &nbsp;
            </div>
             <div class="col-2">
                <button class="pair-adder btn-info small"><span class="icon-add"></span>{{__ 'Add'}}</button>
            </div> 
        </div>

        <span class="arrow"></span>
        <span class="arrow-cover"></span>
    </div>