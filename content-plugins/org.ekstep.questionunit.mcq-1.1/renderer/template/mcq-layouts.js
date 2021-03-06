var MCQController = MCQController || {};

/**
 * The layout class that acts like a base class for layout specific classes
 */
MCQController.layout = MCQController.layout || {
    /**
     * called just before the layout's `getTemplate()` is called. This can be
     * used to perform any initializations on the layout object
     */
    preRender: function (question) { },
    /**
     * returns the html template for the layout
     * @param {object} question the question object
     */
    getTemplate: function (question) { },
    /**
     * called when the option is selected
     * @param {object} event the mouse click or touch event
     * @param {Number} index the index of the option
     */
    onOptionSelected: function (event, index) {
        MCQController.pluginInstance.onOptionSelected(event, index);
    },
    /**
     * called after the DOM is initialized with the layout html
     * @param {object} question the question object
     */
    postRender: function (question) { }
}

/* ** Grid ** */
MCQController.grid = MCQController.grid || jQuery.extend({}, MCQController.layout);

/* The config object used for grid layout */
MCQController.grid.config = {
    optIndices: []
}

/**
 * initializes the grid layout.
 * @param {object} question 
 */
MCQController.grid.preRender = function (question) {
    MCQController.grid.config.optIndices = _.range(question.data.options.length);
}

/**
 * returns the number of rows for the grid layout depening on the number of options
 * @param {Number} optsCount 
 */
MCQController.grid.getRowCount = function (optsCount) {
    return optsCount > 4 ? 2 : 1
}

MCQController.grid.optionStyleUponClick = function (element) {
    $('.mcq-grid-option').removeClass('selected');
    var optElt = $(element).closest('.mcq-grid-option');
    if (optElt) optElt.addClass('selected');
}

/**
 * called when the option in grid layout is selected. It updates the CSS class
 * for selected option element, and also plays the audio if there is audio
 * associated with the option
 * @param {object} event 
 * @param {number} index 
 */
MCQController.grid.onOptionSelected = function (event, index) {
    // clear all selected options and select this option
    var optElt = $(event.target);
    MCQController.grid.optionStyleUponClick(optElt);
    MCQController.pluginInstance.onOptionSelected(event, index);
    if (MCQController.pluginInstance._question.data.options[index].audio)
        MCQController.pluginInstance.playAudio({
            src: MCQController.pluginInstance._question.data.options[index].audio
        });
}

/**
 * returns the option template for grid layout
 * @param {object} option 
 * @param {number} index 
 */
MCQController.grid.getOptionTemplate = function (option, index) {
    var optTemplate = '\
  <div class="mcq-grid-option-outer">\
    <% if (false && option.audio){ %> \
      <div class="mcq-grid-option-audio">\
        <img src="<%= MCQController.pluginInstance.getDefaultAsset("audio-icon2.png") %>"  onclick=MCQController.pluginInstance.playAudio({src:\'<%= val.audio %>\'}) />\
      </div>\
    <% } %> \
    <div class="org-ekstep-questionunit-mcq-option-element mcq-grid-option" onclick="MCQController.grid.onOptionSelected(event, <%= index %>)">\
    <% if (option.image){ %> \
      <div class="mcq-grid-option-image-container">\
        <img class="mcq-grid-option-image" src="<%= MCQController.pluginInstance.getAssetUrl(option.image) %>"/>\
      </div>\
    <% } %> \
    <div class="selected-icon"><img src="<%= MCQController.pluginInstance.getDefaultAsset("tick_icon.png") %>"></div>\
    <% if (option.text){ %> \
      <div class="mcq-grid-option-text">\
        <div class="common-option-text"><%= option.text %></div>\
      </div>\
    <% } %> \
    </div>\
  </div>';
    return _.template(optTemplate)({
        "option": option,
        "index": index
    });
}

/**
 * returns the HTML for all options for the row whose index is specified by `i`
 * @param {array} optIndices the index array for the options
 * @param {number} i the index of the row
 * @param {array} options the array of options
 */
MCQController.grid.getOptionsForRow = function (optIndices, i, options) {
    var rowOpts = [],
        opts = "";
    if (i == 0)
        rowOpts = optIndices.length > 4 ? _.take(optIndices, Math.round((optIndices.length * 1.0) / 2)) :
            _.take(optIndices, optIndices.length);
    else {
        var remainingOptions = optIndices.length - Math.round((optIndices.length * 1.0) / 2);
        rowOpts = _.last(optIndices, remainingOptions);
    }
    _.each(rowOpts, function (o, i) {
        opts += MCQController.grid.getOptionTemplate(options[o], o);
    });
    return opts;
}

/**
 * returns the HTML for row elements with options populated
 * @param {array} optIndices 
 * @param {array} options 
 */
MCQController.grid.getOptionRows = function (optIndices, options) {
    var rowTemplate = '';
    var r = 0;
    maxRow = MCQController.grid.getRowCount(optIndices.length);
    while (r < maxRow) {
        rowTemplate += '<div class="mcq-grid-options-row">\
			<div class="mcq-grid-option-wrapper">' +
            MCQController.grid.getOptionsForRow(optIndices, r, options) +
            '</div></div>';
        r++;
    }
    return rowTemplate;
}

/**
 * returns the options HTML template
 * @param {array} options 
 */
MCQController.grid.getOptionsTemplate = function (options) {
    return MCQController.grid.getOptionRows(MCQController.grid.config.optIndices, options);
}

/**
 * returns the HTML template for the grid layout
 * @param {object} question 
 */
MCQController.grid.getTemplate = function (question) {
    var template =
        org.ekstep.questionunit.backgroundComponent.getBackgroundGraphics() +
        '<div class="mcq-question-container-grid plugin-content-container">\
    <div class="mcq-grid-question-container question-content-container">' +
        org.ekstep.questionunit.questionComponent.generateQuestionComponent() +
        '</div>\
    <div class="mcq-grid-option-container"><div>' +
        MCQController.grid.getOptionsTemplate(question.data.options) +
        '</div></div>\
    </div>';
    return template;
}

/** Horizontal */
MCQController.horizontal = MCQController.horizontal || jQuery.extend({}, MCQController.layout);

/**
 * returns the template for the specified layout
 * @param {string} layout the layout type `horizontal` or `vertical`
 */
MCQController.horizontal.getTemplateForLayout = function (layout) {
    var wrapperStartQuestionComponent = '<div class="question-content-container">';
    var wrapperEndQuestionComponent = '</div>';
    var wrapperEnd = '</div>';
    var layoutTemplate = MCQController.horizontal.getOptionLayout(layout);
    return org.ekstep.questionunit.backgroundComponent.getBackgroundGraphics() + '<div class="mcq-content-container plugin-content-container" id="mcq-question-container">' +
        wrapperStartQuestionComponent +
        org.ekstep.questionunit.questionComponent.generateQuestionComponent(MCQController.pluginInstance._manifest.id) +
        wrapperEndQuestionComponent +
        layoutTemplate +
        wrapperEnd;
}

/**
 * returns complete sequence plugin renderer html, 
 * @param {String} selectedLayout selected layout from editor
 * @param {Object} availableLayout provides list of layouts
 * @memberof org.ekstep.questionunit.mcq.horizontal_and_vertical
 */
MCQController.horizontal.getTemplate = function (question) {
    return MCQController.horizontal.getTemplateForLayout(question.config.layout.toLowerCase());
}

/**
 * returns the options HTML template for the specified `layout` 
 * @param {string} layout 
 */
MCQController.horizontal.getOptionLayout = function (layout) {
    var audioIcon;
    if ('vertical' == layout) {
        audioIcon = "music-blue.png"
    } else {
        audioIcon = "audio-icon2.png"
    }
    return '<div class="outer-option-container ' + layout + '">\
            <div class="option-container ' + layout + '">\
            <div class="option-block-container">\
            <% _.each(question.data.options,function(val,key){ %>\
                <div class="option-block org-ekstep-questionunit-mcq-option-element<% if(val.isCorrect) { %> mcq-correct-answer<% } %>" onclick="MCQController.horizontal.onSelectOption(this, <%= key %>);MCQController.horizontal.onOptionSelected(event,<%= key %>)">\
                    <div class="option-image-container <% if(!val.image) { %> no-image<% } %>" \>\
                  <%  if(val.image) { %>\
                        <img onclick="MCQController.showImageModel(event, \'<%= MCQController.pluginInstance.getAssetUrl(val.image) %>\')" src="<%= MCQController.pluginInstance.getAssetUrl(val.image) %>" />\
                  <% } %>\
                    </div>\
                    <%  if(val.audio) { %>\
                      <img src="<%= MCQController.pluginInstance.getDefaultAsset("' + audioIcon + '") %>" class="audio <% if(val.image) { %>with-image<% } %>" />\
                    <% } %>\
                    <div class="option-text-container<% if(val.audio) { %> with-audio <% } %> <% if(val.image) { %>with-image<% } %>">\
                  <%  if(val.text) { %>\
                        <span class="common-option-text"><%= val.text %></span>\
                  <% } %>\
                    </div>\
                    <img src="<%= MCQController.pluginInstance.getDefaultAsset("tick_icon.png") %>" class="tick" />\
                </div>\
              <% }) %>\
              </div>\
            </div>\
            </div>\
          </div>'
}
MCQController.horizontal.optionStyleUponClick = function (element) {
    $('.option-block').removeClass('selected');
    $(element).addClass('selected');
}
/**
 * called when the option in `horizontal` or `vertical` layout is selected
 * @param {object} element 
 * @param {number} index 
 */
MCQController.horizontal.onSelectOption = function (element, index) {
    MCQController.horizontal.optionStyleUponClick(element);
    if (MCQController.pluginInstance._question.data.options[index].audio) {
        MCQController.pluginInstance.playAudio({
            src: MCQController.pluginInstance._question.data.options[index].audio
        });
    }
}

/** Vertical */
/* vertical layout is exactly same as horizontal */
MCQController.vertical = MCQController.vertical || jQuery.extend({}, MCQController.layout, MCQController.horizontal);

/** Vertical2 */
MCQController.vertical2 = MCQController.vertical2 || jQuery.extend({}, MCQController.layout);

/**
 * returns the HTML template for `vertial2` layout where question is to the left and options are
 * displayed one below other on the right hand side
 * @param {object} question 
 */
MCQController.vertical2.getTemplate = function (question) {
    var questionTemplate = MCQController.vertical2.getQuestionTemplate(question);
    var optionsTemplate = MCQController.vertical2.getOptionsTemplate(question.data.options);
    return org.ekstep.questionunit.backgroundComponent.getBackgroundGraphics() + "<div class='mcq-qLeft-content-container plugin-content-container'>" +
        questionTemplate + optionsTemplate +
        "</div>";
}

/**
 * returns the question HTML template for the `vertical2` and `grid2` layouts
 */
MCQController.vertical2.getQuestionTemplate = function (question) {
    var q_image_class = '';
    if (question.data.question.text) q_image_class = 'mcq-question-image'
    else q_image_class = 'mcq-question-image-full'
    var qTemplate = "<div class='mcq-qLeft-question-container'>\
                <div class=<%= q_image_class%>>\
                <% if(question.data.question.image){%>\
                <img class='q-image' onclick='MCQController.showImageModel(event, <%=MCQController.pluginInstance.getAssetUrl( question.data.question.image) %>)'\ src=<%=MCQController.pluginInstance.getAssetUrl( question.data.question.image) %> />\
                <%}%>\
                </div>\
                <% if(question.data.question.text){%>\
                <div class='mcq-question-text'>\
                  <div class='mcq-text-content'>\
                  <div class='common-qs-title'><%= question.data.question.text %></div>\
                  </div>\
                </div>\
                <%}%>\
                <% if ( question.data.question.audio.length > 0 ){ %> \
                <img class='audio-image' src=<%= MCQController.pluginInstance.getDefaultAsset('audio-icon2.png')%> onclick=MCQController.pluginInstance.playAudio({src:'<%= question.data.question.audio %>'}) />\
                <% } %> \
              </div>\
              ";
    return _.template(qTemplate)({
        "question": question,
        "q_image_class": q_image_class
    });
}

/**
 * returns the HTML options template for the `vertical2` layout
 * @param {array} options 
 */
MCQController.vertical2.getOptionsTemplate = function (options) {
    var opts = ''
    _.each(options, function (val, key, index) {
        opts += MCQController.vertical2.getOption(val, key);
    });
    return "<div class='mcq-2-options-outer-container-vertical'><div class='mcq-2-options-container-vertical'><div class='mcq-2-options-block-container-vertical'>" +
        opts +
        "</div></div>\
";
}

/**
 * returns the option HTML template
 * @param {object} option the option object
 * @param {number} key the index of the option
 */
MCQController.vertical2.getOption = function (option, key) {
    var keyConst = 0;
    if (key > 0) keyConst = 2
    else keyConst = 1
    var optTemplate = "<div class='outer-option-block'>\
    <div class='audio-option-image-container'>\
    <% if ( option.audio.length > 0 ){ %> \
    <img class='audio-option-image'    src=<%= MCQController.pluginInstance.getDefaultAsset('audio-icon2.png')%> onclick=MCQController.pluginInstance.playAudio({src:'<%= option.audio %>'}) />\
    <% } %> \
    </div>\
    <div class='org-ekstep-questionunit-mcq-option-element text-option option-background' onClick=MCQController.vertical2.onOptionSelected(event,<%= key %>)>\
    <div class='text-content'>\
    <span class='common-option-text' >\
    <%= option.text %>\
    <span>\
    </div>\
    <div class='tick-icon-holder'>\
    <img src=<%= MCQController.pluginInstance.getDefaultAsset('tick_icon.png') %> style='height: 100%;'>\
    </div>\
    </div>\
    </div>"
    return _.template(optTemplate)({
        "option": option,
        "key": key,
        "keyConst": keyConst
    });
}

/**
 * adjusts the CSS properties of the options for `vertical2` layout
 * @param {object} question 
 */
MCQController.vertical2.adjustOptions = function (question) {
    var optLength = question.data.options.length;
    if (optLength == 2) {
        $(".text-option-1").css("margin-top", "25.71%");
    } else if (optLength == 3) {
        $(".text-option-1").css("margin-top", "12.85%");
    }
}

/**
 * called after the HTML template is updated in the DOM
 * @param {object} question 
 */
MCQController.vertical2.postRender = function (question) {
    if (question.data.options.length < 4) {
        // MCQController.vertical2.adjustOptions(question);
    }
}

MCQController.vertical2.optionStyleUponClick = function (element) {
    $('.text-option').removeClass('opt-selected');
    var optElt = $(element).closest('.text-option');
    if (optElt) optElt.addClass('opt-selected');
}
/**
 * called when the option in `vertical2` layout is selected/tapped
 * @param {object} event 
 * @param {number} index 
 */
MCQController.vertical2.onOptionSelected = function (event, index) {
    var optionElement = $(event.target);
    MCQController.vertical2.optionStyleUponClick(optionElement);
    MCQController.pluginInstance.onOptionSelected(event, index);
}

/** Grid2 */
MCQController.grid2 = MCQController.grid2 || jQuery.extend({}, MCQController.layout);

/**
 * returns the HTML template for the `grid2` layout
 * @param {object} question 
 */
MCQController.grid2.getTemplate = function (question) {
    var questionTemplate = MCQController.vertical2.getQuestionTemplate(question);
    var optionsTemplate = MCQController.grid2.getOptionsTemplate(question.data.options)
    return org.ekstep.questionunit.backgroundComponent.getBackgroundGraphics() + "<div class='mcq-qLeft-content-container plugin-content-container'>" +
        questionTemplate + optionsTemplate +
        "</div>";
}

/**
 * adjusts the option's CSS properties for `grid2` layout
 * @param {object} question the question object
 */
MCQController.grid2.adjustOptions = function (question) {
    var optLength = question.data.options.length;
    if (optLength == 2) {
        $(".mcq2-2-option").css("margin-top", "15%");
    } else if (optLength == 3) {
        $(".mcq2-2-option3").css("margin-left", "17.15%");
    }
}

/**
 * called after the DOM is updated with the question template HTML
 * @param {object} question the question object
 */
MCQController.grid2.postRender = function (question) {
    if (question.data.options.length < 4) {
        MCQController.grid2.adjustOptions(question);
    }
}

/**
 * returns the HTML template for options for `grid2` layout
 * @param {array} options 
 */
MCQController.grid2.getOptionsTemplate = function (options) {
    var optionTemplate = ''
    _.each(options, function (val, key, index) {
        optionTemplate += MCQController.grid2.getOption(val, key);
    });
    return optionTemplate;
}

/**
 * returns the HTML template of the option in `grid2` template
 * @param {object} option the option object
 * @param {number} key the index of the option
 */
MCQController.grid2.getOption = function (option, key) {
    var optTemplate = " <div class='org-ekstep-questionunit-mcq-option-element mcq2-2-option mcq2-2-option<%=key+1%>' onClick=MCQController.grid2.onOptionSelected(event,<%= key %>)>\
  <%if(option.image){%>\
      <img class='mcq2-2-option-image'\
      src=<%=MCQController.pluginInstance.getAssetUrl(option.image) %> />\
  <%}%>\
  <%if(!option.image && option.text){%>\
    <div class='mcq2-2-option-text common-option-text'><%= option.text %></div>\
  <%}%>\
  <div class='mcq2-2-check-image-holder' >\
    <img class='mcq2-2-check-image'\
    src=<%= MCQController.pluginInstance.getDefaultAsset('tick_icon.png') %> />\
  </div>\
</div>\
";
    return _.template(optTemplate)({
        "option": option,
        "key": key
    });
}

MCQController.grid2.optionStyleUponClick = function (element) {
    $('.mcq2-2-option').removeClass('opt-selected');
    var optElt = $(element).closest('.mcq2-2-option');
    if (optElt) optElt.addClass('opt-selected');
}
/**
 * called when the option in `grid2` layout is selected
 * @param {object} event 
 * @param {number} index 
 */
MCQController.grid2.onOptionSelected = function (event, index) {    
    var optElt = $(event.target);
    MCQController.grid2.optionStyleUponClick(optElt);
    MCQController.pluginInstance.onOptionSelected(event, index);
    if (MCQController.pluginInstance._question.data.options[index].audio)
        MCQController.pluginInstance.playAudio({
            src: MCQController.pluginInstance._question.data.options[index].audio
        });
}

//# sourceURL=mcq-layouts.js
