/*!
 * EDILS.JS
 */
var Edils = (function(window, undefined){
  "use strict";
  
  var
  // Объект текущей конфигурации.
  config = {
    
    // Вид анимации.
    // string: [ linear || delta || cube || flow || zoom || flip || book || concave || fade || none ]
    animation: "linear",
    
    // Продолжительность анимации.
    // string: [ instantly<0ms> || fast<400ms> || normal<700ms> || slow<1000ms> ] // see: transitionDuration;
    duration: "normal",
    
    // Направление движения слайдов.
    // string: [ horizontal || h || vertical || v ]
    direction: "horizontal",
    
    // Количество миллисекунд между автоматическим переходом к следующему слайду.
    // ! К нему также будет добавлено значение config.duration, для синхронизации перехода.
    // Установка в 0, отключает автопереход.
    auto: 0,
    
    // Размер слайда по высоте.
    height: "75%",
    
    // Размер слайда по ширине.
    width: "80%",
    
    // Коэфицент отступа, вокруг содержимого
    margin: 0.1,
    
    // Растояние до отключенных слайдов.
    distanceToHidden: 1,
    
    // Использовать историю браузера.
    history: true,
    
    // Использовать клавиатуру для управления.
    keyboard: true,
    
    // Зациклить автопереходы.
    loop: false,
    
    // Растягивает содержимое, учитывая высоту слайда и не учитывая коэфицент отступа. 
    expand: false,
    
    // Устанавливает вертикальное выравнивание слайда.
    middle: true,
    
    // Изменить направление движения слайдов.
    reverse: false,
    
    // Отображать панель управления.
    controls: true,
    
    // Отображать строку прогресса.
    progress: true
  },
  // Ссылка на документ.
  document = window.document,
  // Текущий слайд (узел).
  currentSlide,
  // Текущий слайд (индекс).
  indexSlide,
  // Ссылка на config[loop].
  loop,
  // Ссылка на config[auto].
  auto = 0,
  // Идентификаторы таймеров
  autoPlayTimeout = 0,
  nextPlayTimeout = 0,
  updateTimerTimeout = 0,
  //
  minScale = 0.2,
  maxScale = 1,
  scale = 1,
  // Хэш-объект времени выполнения анимации CSS.
  transitionDuration = { instantly: 0, fast: 400, normal: 700, slow: 1000 },
    // Время выполнения CSS анимации.
  delay = 0,
  // Стек анимаций.
  timersAnimate = [],
  // Идентификатор таймера анимаций.
  timersTimeout = 0,
  // Alias
  fn = "prototype",
  // Объект содержвщий свойства и методы, значения которых зависят от типа и 
  // версии браузера.
  support = (function() {
    
    var shim, shimName, shimCond, i, evalFixIE = "0||",
    body = document.body,
    div = document.createElement("div"),
    self = {};
    
    div.innerHTML = "   <span></span>";
    div.style.cssText = "opacity:.9;float:left;";
    
    try {
      // Если отсутствует поддержка Selector API.
      div.querySelectorAll("span");
      div.querySelector("span");
    } catch(e) {
      throw new Error("Браузер не поддерживается. " + e.message);
    }
    
    // IE.
    self.ie = (document.all && !window.opera);
    // Значение свойства opacity нормализуется, если браузер поддерживает его.
    self.opacity = /^0.9/.test( div.style.opacity ) ? "opacity" : "filter";
    // IE поддерживает собственное свойство styleFloat.
    self.float = !!div.style.cssFloat ? "cssFloat" : "styleFloat";
    // IE удаляет все начальные пробелы из символьной строки, 
    // передаваемой свойству innerHTML.
    self.leadingWhitespace = div.firstChild.nodeType === 3;
    
    // Запрос на отображение элемента в полноэкранном режиме.
    // https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Using_full_screen_mode?redirectlocale=en-US&redirectslug=Web%2FGuide%2FDOM%2FUsing_full_screen_mode
    // https://developer.apple.com/library/safari/documentation/WebKit/Reference/ElementClassRef/Element/Element.html
    // http://msdn.microsoft.com/ru-ru/library/ie/dn254939(v=vs.85).aspx
    self.requestFullscreen = body.requestFullscreen ||
                             body.mozRequestFullScreen ||
                             body.webkitRequestFullscreen ||
                             body.webkitRequestFullScreen ||
                             body.msRequestFullscreen;
                       
    // Выход из полноэкранного режима.
    // https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Using_full_screen_mode?redirectlocale=en-US&redirectslug=Web%2FGuide%2FDOM%2FUsing_full_screen_mode
    // https://developer.apple.com/library/safari/documentation/UserExperience/Reference/DocumentAdditionsReference/DocumentAdditions/DocumentAdditions.html#//apple_ref/javascript/instm/Document/webkitCancelFullScreen
    // http://msdn.microsoft.com/ru-ru/library/ie/dn254936(v=vs.85).aspx
    self.cancelFullScreen = document.cancelFullScreen ||
                            document.exitFullscreen ||
                            document.mozCancelFullScreen ||
                            document.webkitExitFullscreen ||
                            document.webkitCancelFullScreen ||
                            document.msExitFullscreen;
    
    // Поддержка CSS3 3D.
    self.transforms3D = "WebkitPerspective" in body.style ||
                        "MozPerspective" in body.style ||
                        "msPerspective" in body.style ||
                        "OPerspective" in body.style ||
                        "perspective" in body.style;
                  
    // Поддержка CSS3 2D.
    self.transforms2D = "WebkitTransform" in body.style ||
                        "MozTransform" in body.style ||
                        "msTransform" in body.style ||
                        "OTransform" in body.style ||
                        "transform" in body.style;
    // Методы
    // Поддержка едениц для значений css свойств.
    self.hasUnit = function(prop) {
      var props = "fontWeight lineHeight opacity zIndex zoom".split(" ");
      prop = prop.replace(/-([a-z])/ig, function(a,b) {
        return b.toUpperCase();
      });
      // false, если требуются еденицы.
      return props.indexOf( prop ) !== -1 || false;
    };
    // Clear elm.
    div = null;
    
    
    // Прослойки для старых браузеров.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim 
    // http://blog.stevenlevithan.com/archives/faster-trim-javascript
    // http://www.robertpenner.com/easing/
    shim = [
      { name: "slice",   cond: "(function(n){var proto=Array.prototype;var name=proto[n];try{name.call(document.documentElement);return false}catch(e){return proto;}})", body: "(function(){'use strict';var d=Array.prototype.slice;return function(b,c){var i,arrl=this.length,a=[];if(this.charAt){for(i=0;i<arrl;i++){a.push(this.charAt(i))}}else{for(i=0;i<this.length;i++){a.push(this[i])}}return d.call(a,b,c||a.length)}})()"},
      { name: "forEach", cond: "(function(n){var proto=Array.prototype;return proto[n]?false:proto})", body: "(function(a,b){'use strict';var i,len;for(i=0,len=this.length;i<len;++i){if(i in this){a.call(b,this[i],i,this)}}})"},
      { name: "indexOf", cond: "(function(n){var proto=Array.prototype;return proto[n]?false:proto})", body: "(function(searchElement,fromIndex){var i,pivot=(fromIndex)?fromIndex:0,length;if(!this){throw new TypeError();}length=this.length;if(length===0||pivot>=length){return-1}if(pivot<0){pivot=length-Math.abs(pivot)}for(i=pivot;i<length;i++){if(this[i]===searchElement){return i}}return-1})"},
      { name: "create",  cond: "(function(n){var proto=Object;return proto[n]?false:proto})", body: "(function(){function F(){};return function(o){if(arguments.length!=1){throw new Error('Object.create implementation only accepts one parameter.');}F.prototype=o;return new F()}})()"},
      { name: "trim",    cond: "(function(n){var proto=String.prototype;return proto[n]?false:proto})", body: "(function(){return this.replace(/^\\s+|\\s+$/g,'')})"},
      
      { name: "linearTween", cond: Math, body: "(function(t,b,c,d){return c*t/d+b})"},
      { name: "easeOutCirc", cond: Math, body: "(function(t,b,c,d){return c * Math.sqrt(1 - (t=t/d-1)*t) + b})"},
      { name: "easeInExpo",  cond: Math, body: "(function(t,b,c,d){return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b})"}
    ];
    
    i = shim.length;
    
    while( i-- ) {
      shimName = shim[ i ].name;
      shimCond = (typeof shim[ i ].cond === "string") 
                 ? eval(evalFixIE + shim[ i ].cond)(shimName) : shim[ i ].cond;
                 
      if( shimCond !== false ) {
        shimCond[ shimName ] = eval(evalFixIE + shim[ i ].body);
      }
    }
    
    return self;
  })(),
  
  // Объект ссылок на необходимые для работы узлы.
  // see setupDom().
  // Реализует методы для работы с хранилищем элементов.
  dom = Object.create({
    guid: 0,
    cache: {},
    data: function(elem, value) {
      var 
      expando = mark(),
      id = elem[ expando ],
      curCache;
      
      if( !id ) {
        id = elem[ expando ] = ++this.guid;
        this.cache[ id ] = {};
      }
      curCache = this.cache[ id ];
      
      return ( typeof value === "string" ) ? curCache[ value ] : curCache;
    },
    remove: function(elem) {
      var
      expando = mark(),
      id = elem[ expando ];
      
      if( !id ) return;
      
      delete this.cache[ id ];
      try {
        delete elem[ expando ];
      } catch(e) {
        if( elem.removeAttribute ) elem.removeAttribute(expando);
      }
    }
  }),
  // Конструктор EDILS.
  Edils = function( value ) {
    return new Edils[fn].init( value );
  };
  
  Edils[fn] = {
    
    init: function( slide, prevObject ) {
      var sections = querySelectorSlides(),
          t_slide = typeof slide,
          nodes = [],
          total = 0,
          whitespace,
          section,
          tmp,
          i;
      
      // Если значение не определено, 
      // будут возвращены все секции, если они существуют.
      // Undefined, Null
      if( slide == null ) {
        total = sections.length;
        Edils.extend.call(this, sections);
      }
      
      // Если значение это число, то оно сопоставимо с номером слайда.
      // Если такой слайд существует, он будет добавлен в возвращаемый объект.
      // Number
      if( t_slide === "number" ) {
        if( sections[ slide ] ) {
          Edils.extend.call(this, [ sections[ slide ] ]);
          total += 1;
        }
      }
      
      // Если в качестве параметра была передана функция, 
      // то данная функция считается оболочкой, которая содержит в себе тот или иной код.
      // Переданная функция будет исполнена, после чего будет вызвана функция обнавляющая дерево слайдов.
      // reload() - обнавляет дерево слайдов, отключив CSS анимацию на время исполнения.
      // Function object
      if( t_slide === "function" ) {
        slide.call(null);
        reload();
      }
      
      if( is_type( slide ) === "array" ) {
        total = slide.length;
        Edils.extend.call(this, slide);
        if( prevObject ) this.prevObject = prevObject;
      }
      
      // String
      if( t_slide === "string" ) {
        
        // Если значение это строка, которая начинается с решетки (#), 
        // то оно сопостовимо с идентификатором слайда.
        // Если такой слайд существует, он будет добавлен в возвращаемый объект.
        if( /^#\w+/.test(slide) ) {
          if( section = document.querySelector(slide) ) {
            i = sections.indexOf( section );
            if( i > -1 ) {
              Edils.extend.call(this, [ section ]);
              total += 1;
            }
          }
          // Удалить элемент, чтобы он повторно не был добавлен в набор.
          section = null;
        }
        else {
          section = createElement( "section" );
          
          // Если не html, конвертировать в текстовой узел.
          if( !/<|&#?\w+;/.test(slide) ) {
            nodes.push( document.createTextNode( slide ) );
          }
          else {
            tmp = createElement( "div" );
            tmp.innerHTML = slide;
            
            if( !support.leadingWhitespace && (whitespace = slide.match(/^(\s+)/) || []).length ) {
              nodes.push( document.createTextNode( whitespace[1] ) );
            }
            merge( nodes, tmp.childNodes );
          }
          
          nodes.forEach(function(elem) {
            section.appendChild( elem );
          });
          
          tmp = null;
        }
        
      }
      
      // Все другие объекты. Не Null.
      // Исключить ATTRIBUTE_NODE, ENTITY_REFERENCE_NODE, ENTITY_NODE, NOTATION_NODE
      if( t_slide === "object" && 
          slide && 
          slide.nodeType && 
          slide.nodeType !== 2 &&
          slide.nodeType !== 5 &&
          slide.nodeType !== 6 &&
          slide.nodeType !== 12 ) {
        
        section = createElement( "section" );
        section.appendChild( slide );
      }
      
      // Если был создан новый элемент, добавляем в набор.
      if( section ) {
        Edils.extend.call(this, [ section ]);
        dom.base.appendChild( section );
        total += 1;
      }
      
      this.length = total;
    },
    
    constructor: Edils,
    length: 0
  };
  
  Edils.extend =
  Edils[fn].include = function(o) {
    for( var prop in o ) this[ prop ] = o[ prop ];
    return this;
  };
  
  Edils[fn].init[fn] = Edils[fn];
  
  Edils.extend({
    // Установить конфигурацию.
    options: function() {
      var fn = [
        function() { return config; },
        function(a) { if( a && typeof a === "object" ) start( a ); else return config[ a ]; },
        function(a,b) { var o = {}; o[ a ] = b; start( o ); }
	  ];
      
      for( var n = 3; n--; ) {
        if( fn[ n ].length == arguments.length ) return fn[ n ].apply( null, arguments );
      }
    }
  });
  
  // Генератор уникальных идентификаторов.
  // http://jdevnotes.blogspot.ru/2010/03/guid-javascript.html
  function guid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c){
      var r = Math.random()*16|0, v = c == "x" ? r : (r&0x3|0x8);
      return v.toString(16);
    }).toUpperCase();
  }
  
  // Текущая временная метка.
  function now() {
    return Date.now ? Date.now() : ( new Date() ).getTime();
  }
  
  // Текущий маркер.
  function mark() {
    return mark.expando || ( mark.expando = guid() );
  }
  
  // http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
  function is_type(o) {
    return ({}).toString.call( o ).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
  }
  
  // Объект подобный масиву, в массив.
  function toArray(o) {
    return Array.prototype.slice.call(o);
  }
  
  // Строка, преобразованная в массив по разделителю " ".
  function trimmedClasses(str) {
    var trimmed = str.trim();
    return trimmed ? trimmed.split(/\s+/) : [];
  }
  
  // Объеденить один и более масивов.
  function merge(/*root, array, ...*/) {
    var args = toArray( arguments ).reverse(),
        root = args.pop(),
        i = root.length,
        n = args.length,
        j, l;

    while( n-- && (j = 0) === 0 ) {
      if( typeof args[ n ].length === "number" ) {
        for( l = args[ n ].length; j < l; j++ ) {
          root[ i++ ] = args[ n ][ j ];
        }
      } else {
        while( args[ n ][ j ] !== undefined ) {
          root[ i++ ] = args[ n ][ j++ ];
        }
      }
    }
    root.length = i;
    return root;
  }
  
  function createElement(tagName, attribs, parent) {
    var elem = document.createElement( tagName );
    if( attribs ) Edils.extend.call(elem, attribs);
    if( parent )  parent.appendChild(elem );
    
    return elem;
  }
  
  function findElement(tagName, root) {
    var results = [];
    root = root || document;
    if( typeof tagName === "string" && (root.nodeType === 1 || root.nodeType === 9) ) {
      Array.prototype.push.apply(results, root.getElementsByTagName( tagName.trim() ));
    }
    return results;
  }
  
  function css(elem, name, value) {
    // Если передан объект свойств и значений.
    if( typeof name === "object" && name ) {
      for( var prop in name ) css( elem, prop, name[ prop ] );
    }
    else if( typeof value !== "undefined" ) {
      // Если числовая строка, после преобразования в число не имеет суффикс,
      // и свойство поддерживает суффикс, то будет использованна ед. "px".
      if( (parseFloat(value) == value) && !support.hasUnit(name) ) {
        value += "px";
      }
      // Преобразовать значение opacity или float в зависимости от браузера.
      name = (name === "opacity") ? support.opacity : (name === "float") ? support.float : name;
      
      if( name === "filter" ) {
        if( value > 0.99 ) {
          elem.style.removeAttribute("filter");
        }
        else {
          elem.style[ name ] = "alpha(opacity="+ (value * 100) +")";
        }
      }
      else elem.style[ name ] = value;
    }
    else {
      if( elem.style[ name ] ) return elem.style[ name ];
      
      // if gt IE 8 || FF || Chrome || Opera || Safari etc.
      if( document.defaultView ) {
        return document.defaultView.getComputedStyle(elem, null).getPropertyValue(name);
      }
      
      // if lt IE 9
      if( name === "opacity" ) name = "filter";
      value = elem.currentStyle[name.replace(/-([a-z])/ig, function(all,letter) {
          return letter.toUpperCase();
        })];
      if( name === "filter" ) {
        value = value.replace(/alpha\(opacity=([0-9]+)\)/, function (a,b) {
          return b / 100;
        });
      }
      
      return value === "" ? 1 : value;
    }
    return elem;
  }
  
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes
  function attr(elem, name, value) {
    var exists,
    props = {
      "class": "className",
      tabindex: "tabIndex",
      contenteditable: "contentEditable"
    };
    
    name = props[name] || name;
    exists = typeof elem[name] !== "undefined";
    
    if( value !== undefined ) {
      exists ? elem[ name ] = value : elem.setAttribute( name, value );
    }
    
    return exists ? elem[ name ] : elem.getAttribute( name );
  }
  
  // data-* аттрибуты.
  // http://jsfiddle.net/Z743A/
  function dataset(elem, name, value) {
    // Игнорировать текстовые узлы и комментарии.
    if( !elem || elem.nodeType === 3 || elem.nodeType === 8 ) {
      return;
    }
    
    var dataset = !!elem.dataset;
    
    if( !dataset ) {
      name = "data-" + name.replace(/([A-Z])/g, function(a,b) {
        return "-" + b.toLowerCase();
      });
    }
    
    if( value !== undefined ) {
      if( dataset ) {
        elem.dataset[ name ] = value;
      } else {
        // Все значения, кроме undefined будут конвертированны в строку.
        attr(elem, name, value+"");
      }
    }
    
    return dataset ? elem.dataset[name] : attr(elem, name);
  }
  
  function addClass(elem, classList) {
    var
    oldList = trimmedClasses( elem.className ),
    newList = trimmedClasses( classList ),
    l = newList.length, updated = false;
    
    while( l-- ) {
      if( oldList.indexOf(newList[ l ]) === -1 ) {
          oldList.push( newList[ l ] );
          updated = true;
        }
    }
    
    if( updated ) elem.className = oldList.join(" ");
    
    return elem;
  }
  
  function removeClass(elem, classList) {
    var
    oldList = trimmedClasses( elem.className ),
    newList = trimmedClasses( classList ),
    l = newList.length, updated = false, i;

    while( l-- ) {
      i = oldList.indexOf(newList[ l ]);
      if( i > -1 ) {
         oldList.splice(i, 1);
         updated = true;
      }
    }
    
    if( updated ) elem.className = oldList.join(" ");
    
    return elem;
  }
  
  function hasClass(elem, className) {
    if( className ) {
      var oldList = trimmedClasses( elem.className );
      return oldList.indexOf( className.trim() ) !== -1;
    }
  }
  
  // Объект для работы с анимацией.
  Edils.animate = (function() {
    
    var init = function(elem, prop, opt) {
      var start, end, unit, name, e, args = arguments;
      
      if( typeof opt !== "object" || !opt ) {
        opt = {
          easing:   args[3],
          duration: args[2],
          complete: args[4]
        };
      }
      
      if( typeof opt.duration !== "number" ) opt.duration = 250;
      opt.easing = Math[opt.easing] || Math.linearTween;
      //opt.curAnim = Edils.merge({}, prop);
      opt.curAnim = Edils.extend.call({}, prop);
      
      for( name in prop ) {
        e = new init.prototype.init(elem, opt, name);
        
        start = parseFloat( css( elem, name ) ) || 0;
        end = parseFloat( prop[ name ] );
        unit = support.hasUnit(name) ? "" : "px";
        e.custom( start, end, unit );
      }
    },
    
    stop = function(elem) {
      var t, i = timersAnimate.length;
      
      while( i-- ) {
        t = timersAnimate[ i ];
        
        if( t && t.elem == elem ) {
          timersAnimate.splice(i--, 1);
        }
      }
    };
    
    init.prototype = {
      init: function(elem, options, prop) {
        this.options = options;
        this.elem = elem;
        this.prop = prop;
        
        if( !options.orig ) {
          options.orig = {};
        }
        
      }
    };
    
    init.prototype.init.prototype = {
      update: function() {
        (init.prototype.init.step[ this.prop ] || init.prototype.init.step._default)( this );
        
        if( this.options.step ) {
          this.options.step.call(this.elem, this.now, this);
        }
      },
      
      custom: function(from, to, unit) {
        var self = this, timers, i;
        
        this.startTime = now();
        this.start = from;
        this.end = to;
        this.unit = unit;
        this.now = this.start;
        this.pos = this.state = 0;
        
        function t(gotoEnd) {
          return self.step(gotoEnd);
        }
        
        t.elem = this.elem;
        
        if( t() && timersAnimate.push(t) == 1 ) {
          
          (function runNext() {
            timers = timersAnimate;
            
            for( i = 0; i < timers.length; i++ ) {
              if ( !timers[i]() ) timers.splice(i--, 1);
            }
            
            if( !timers.length ) {
              clearTimeout( timersTimeout );
              timersTimeout = 0;
            }
            else {
              timersTimeout = setTimeout( runNext, 10 );
            }
          })();
        }
      },
      
      step: function(gotoEnd) {
        var t = now(), done, i;
        
        if ( gotoEnd || t >= this.options.duration + this.startTime ) {
          this.now = this.end;
          this.pos = this.state = 1;
          this.update();
          this.options.curAnim[ this.prop ] = true;
          
          done = true;
          
          for ( i in this.options.curAnim ) {
            if ( this.options.curAnim[i] !== true ) done = false;
          }
          
          if ( done ) {
            if (this.options.complete) this.options.complete.call(this.elem);
          }
          return false;
        }
        else {
          var n = t - this.startTime;
          
          this.state = n / this.options.duration;
          this.pos = this.options.easing(n, 0, 1, this.options.duration);
          this.now = this.start + ((this.end - this.start) * this.pos);
          this.update();
        }
        return true;
      }
    };
    
    
    Edils.extend.call(init.prototype.init, {
      step: {
        opacity: function(f) {
          css(f.elem, { opacity: f.now });
        },
        
        _default: function(f) {
          try {
            if( f.elem.style && f.elem.style[ f.prop ] != null ) {
              f.elem.style[ f.prop ] = f.now + f.unit;
            }
            else {
              f.elem[ f.prop ] = f.now;
            }
          }
          catch (e) {}
        }
      }
    });
    
    //log(init);
    
    return {
      init: init,
      stop: stop
    };
    
  })();
  
  // Объект для работы с событиями.
  Edils.event = (function() {
	var 
    guid = 0,
    // Return boolean value. jQuery
    returnTrue = function() {return true;},
    returnFalse = function() {return false;},
    attr = "altKey ctrlKey detail metaKey relatedTarget shiftKey view which".split(" "),
    // fix <MouseEvent> и <KeyboardEvent>
    fixHooks = {
      
      key: {
        event: "keydown keypress keyup".split(" "),
        attr: "char charCode key keyCode".split(" "),
        fix: function(event, nativeEvent) {
          // Эквивалентно коду нажатой клавиши при наступлении события от клавиатуры.
          if( event.which == null ) {
              event.which = nativeEvent.charCode != null ? nativeEvent.charCode : nativeEvent.keyCode;
          }
          return event;
        }
      },
      
      mouse: {
        event: "click contextmenu dblclick mousedown mouseenter mouseleave mousemove mouseout mouseover mouseup show".split(" "),
        attr: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
        fix: function(event, nativeEvent) {
          var doc, body, 
              fromElement = nativeEvent.fromElement,
              button = nativeEvent.button;
          
          if( !event.relatedTarget && fromElement ) {
               event.relatedTarget =  fromElement === event.target ? nativeEvent.toElement : fromElement;
          }
          
          // Предоставляют данные о положении курсора мыши относительно всего документа. 
          if( event.pageX == null && nativeEvent.clientX != null ) {
            doc = document.documentElement,
           body = document.body;

            event.pageX = nativeEvent.clientX + 
                (doc && doc.scrollLeft || body && body.scrollLeft || 0) - 
                (doc && doc.clientLeft || body && body.clientLeft || 0) ;
        
            event.pageY = nativeEvent.clientY + 
                (doc && doc.scrollTop  || body && body.scrollTop  || 0) - 
                (doc && doc.clientTop  || body && body.clientTop  || 0) ;
          }
          // Конпка мыши, при наступлении события от мыши.
          if( button !== undefined ) {
            event.button = (button & 1 ? 0 :
                           (button & 4 ? 1 :
                           (button & 2 ? 2 : 0 )));
          }
          return event;
        }
      }
      
    },
    // Унаследованные методы для объекта Event.
    protoevent = {
      
      constructor: function Event(src) {
        // http://www.w3.org/TR/DOM-Level-2-Events/events.html
        // http://www.w3.org/TR/DOM-Level-3-Events/
        // Свойства, перечисленные для каждого объекта Event. <Interface Event>
        this.currentTarget = src.currentTarget;
        this.cancelable = src.cancelable || false;
        this.eventPhase = src.eventPhase || 0;
        this.timeStamp = src.timeStamp || now();
        this.isTrusted = src.isTrusted || false;
        this.bubbles = src.bubbles || false;
        this.target = src.target;
        this.type = src.type;
        this.mark = mark();
        this.nativeEvent = src;
        this.isDefaultPrevented =
                ( src.defaultPrevented ||
                  src.returnValue === false ||
                  src.getPreventDefault && src.getPreventDefault() ) ? returnTrue : returnFalse;
        
        return this;
      },
      
      preventDefault: function() {
        if( this.nativeEvent ) {
          if( this.nativeEvent.preventDefault ) {
            this.nativeEvent.preventDefault();
          }
          else {
            this.nativeEvent.returnValue = false;
          }
        }
        this.isDefaultPrevented = returnTrue;
      },
      
      stopPropagation: function() {
        if( this.nativeEvent ) {
          if( this.nativeEvent.stopPropagation ) {
            this.nativeEvent.stopPropagation();
          }
          this.nativeEvent.cancelBubble = true;
        }
        this.isPropagationStopped = returnTrue;
      },
      
      stopImmediatePropagation: function() {
        this.isImmediatePropagationStopped = returnTrue;
        this.stopPropagation();
      },
      
      isDefaultPrevented: returnFalse,
      isPropagationStopped: returnFalse,
      isImmediatePropagationStopped: returnFalse
  };
    
    function bind(elem, type, handler, selector) {
	  var handlers,
          dispatcher,
          handleObj,
          handlerTyped,
          data = dom.data( elem );
	  
	  if( !data ) return;
      
      // Отменить оснащенные функции.
      if( !handler.guid ) {
           handler.guid = ++guid;
      }
      
	  // Объект для хранения обработчиков.
      if( !(handlers = data.handlers) ) {
            handlers = data.handlers = {};
      }
      
      // Опрделить диспетчер обработчиков.
      if( !(dispatcher = data.dispatcher) ) {
            dispatcher = data.dispatcher = function( event ) {
              // Предотвратить срабатывание события, если оно уже инициировано с помощью триггера.
              return (!event || Edils.event.triggered !== event.type) ? 
              dispatch.apply(dispatcher.elem, arguments) : undefined;
            };
            
        // Ссылка на элемент, чтобы предотвратить утечку памяти в IE.
        dispatcher.elem = elem;
      }
      
      if( !type ) {
        return;
      }
      
      // Создать объект обработчик события, вместо фун. обработчика, 
      // в том числе и для управления делигатом.
      handleObj = {
        type: type,
        handler: handler,
        guid: handler.guid,
        selector: selector
      };
      
      // Определить  массив обработчиков по типу событий.
	  if( !(handlerTyped = handlers[type] ) ) {
            handlerTyped = handlers[type] = [];
            handlerTyped.delegateCount = 0;
        
        // Привязать диспетчера событий к элементу.
        try { elem.addEventListener(type, dispatcher, false);
		} catch(e) {
          try { elem.attachEvent("on" + type, dispatcher);
          } catch(e) {}
        }
        
	  }
      
      // Добавить обработчики элементов делегатов в начало массива.
      if( selector ) {
        handlerTyped.splice( handlerTyped.delegateCount++, 0, handleObj );
      }
      // Добавить обработчики элементов в конец массива.
      else {
        handlerTyped.push(handleObj);
      }
      
      // Очистить элемент для предотвращения утечек памяти в IE.
      elem = null;
    }
	
    function unbind(elem, type, handler, selector) {
      var handlers,
          handlerTyped,
          existed,
          j,
          handleObj,
          data = dom.data( elem ),
          isEmpty = function(o) {
            for( var x in o ) return false;
            return true;
          };
      
      if( !data || !(handlers = data.handlers) ) {
        return;
      }
      
      // Удалить все привязанные обработчики.
      if( !type ) {
        for( type in handlers ) unbind(elem, type, handler, selector);
        return;
      }
      
      // Обработчики конкретного типа.
      handlerTyped = handlers[ type ] || [];
      existed = j = handlerTyped.length;
      
      while(j--) {
        handleObj = handlerTyped[ j ];
        
        if( ( type === handleObj.type ) && 
            ( !handler || handler.guid === handleObj.guid ) && 
            ( !selector || selector === handleObj.selector || selector === "*" && handleObj.selector ) ) {
          
          handlerTyped.splice( j, 1 );
          
          if ( handleObj.selector ) {
            handlerTyped.delegateCount--;
          }
        }
      }
      
      // Если обработчики существовали и
      // если обработчики вырезаны.
      if( existed && !handlerTyped.length ) {
        
        try {
          elem.removeEventListener(type, data.dispatcher, false);
        } catch(e) {
          try {
            var ontype = "on" + type;
            if( typeof elem[ontype] === "undefined" ) {
                       elem[ontype] = null;
            }
            elem.detachEvent( ontype, data.dispatcher );
          } catch(e) {}
        }
        
        delete handlers[ type ];
      }
      
      // Проверить наличие любых обработчиков.
      if( isEmpty(handlers) ) {
        delete data.handlers;
        delete data.dispatcher;
      }
      
      // Проверить, нужны ли данные вообще.
      if( isEmpty(data) ) {
        dom.remove(elem);
      }
      
    }
    
    function trigger(elem, event) {
      var cur,
          type,
          ontype,
          eventPath = [],
          dispatcher,
          tmp;
      
      cur = elem = elem || document;
      
      // TEXT_NODE or COMMENT_NODE
      if( elem.nodeType === 3 || elem.nodeType === 8 ) {
        return;
      }
      
      // <String> or <Event> or <EdilsEvent>
      // Сформировать новый объект event.
      if( typeof event === "string" ) {
        event = {
          type: event,
          target: elem
        };
      }
      
      // Нормализуем объект.
      // Повторная нормализация в диспетчере не нужна.
      event = fix( event );
      
      type = event.type;
      ontype = "on" + type;
      
      for( ; cur; cur = cur.parentNode ) {
        eventPath.push( cur );
      }
      
      eventPath.forEach(function(cur, i) {
        if( event.isPropagationStopped() ) {
          return;
        }
        
        dispatcher = ( dom.data(cur, "handlers") || {} )[ event.type ] && dom.data(cur, "dispatcher");
        // Выполнить диспетчер событий, если элемент содержит его.
        if( dispatcher ) {
            dispatcher.call( cur, event );
        }
        
      });
      
      if( !event.isDefaultPrevented() ) {
        
        // Инициировать действие по умолчанию для узла.
        // Пропускать глобальный объект window.
        if( elem[ type ] && (elem != null && elem == elem.window) ) {
          
          // Не инициировать "on" методы.
          tmp = elem[ ontype ];
          
          if( tmp ) elem[ ontype ] = null;
          Edils.event.triggered = type;
          
          try { elem[ type ]();
          } catch(e) {}
          
          Edils.event.triggered = void(0);
          if( tmp ) elem[ ontype ] = tmp;
        }
      }
      
    }
    
    function dispatch(event) {
      
      // Пропускаем событие из триггера.
      if( event && event.mark !== mark() ) {
        event = fix( event );
      }
      
      // Нормализовать объект события.
      event = fix( event );
      
      var args = toArray( arguments ),
          handlerQueue = [],
          handlerTyped = ( dom.data( this, "handlers" ) || {} )[ event.type ] || [];
      
      args[0] = event;
      event.delegateTarget = this;
      
      // Определить новую очередь обработчиков.
      handlerQueue = handlers.call( this, event, handlerTyped );
      
      handlerQueue.forEach(function(matched) {
        if( event.isPropagationStopped() ) {
          return;
        }
        event.currentTarget = matched.elem;
        
        matched.handlers.forEach(function(handleObj) {
          if( event.isImmediatePropagationStopped() ) {
            return;
          }
          event.handleObj = handleObj;
          handleObj.handler.apply(matched.elem, args);
        });
        
      });
      
    }
    
    function handlers(event, handlerTyped) {
      var delegateCount = handlerTyped.delegateCount,
          node = event.target,
          matches,
          i,
          handleObj,
          sel,
          handlerQueue = [];
      
      // Поиск обработчиков элементов делегатов.
      // Пропускать всплытие не левой кнопки мыши в FF.
      if( delegateCount && node.nodeType && (!event.button || event.type !== "click") ) {
        // node: узел, в котором произошло событие.
        // this: узел, для которого установлено событие (делегат).
        // Всплываем вверх.
        for( ; node != this; node = node.parentNode || this ) {
          
          // Проверять только ELEMENT_NODE.
          // Не обрабатывать отключенные элементы.
          if( node.nodeType === 1 && (node.disabled !== true || event.type !== "click") ) {
            matches = [];
            for( i = 0; i < delegateCount; i++ ) {
              // Объект обработчика элемента.
              handleObj = handlerTyped[ i ];
              
              // Избежать конфликта со свойствами Object.prototype.
              sel = handleObj.selector + " ";
              
              // Поиск элемента селектора, в дереве элемента делегата
              // Сопоставим ли он с текущим узлом node, в котором произошло событие.
              if( matches[ sel ] === undefined ) {
                  matches[ sel ] = findElement( sel, this ).indexOf( node ) !== -1;
              }
              
              // Если selector, на котором установлен делегат это уэел node.
              if ( matches[ sel ] ) {
                   matches.push( handleObj );
              }
              
            }
            // Формируем новый стэк вызова объектов обработчиков.
            if ( matches.length ) {
              handlerQueue.push({ elem: node, handlers: matches });
            }
            
          }
          
        }
        
      }
      
      // Добавить непосредственных обработчиков.
      if( delegateCount < handlerTyped.length ) {
        handlerQueue.push({ elem: this, handlers: handlerTyped.slice( delegateCount ) });
      }
      
      return handlerQueue;
    }
    
	function fix(event) {
	  // If fixed!
	  if( event.mark === mark() ) return event;
	  
      var nativeEvent = event,
          type = event.type,
          ontype = "on" + type,
          h,
          _attr = attr,
          fixFn;
      
      // Новый объект event.
      event = Object.
              create( protoevent ).
              constructor( event );
      
      // Support: IE<9
	  if( !event.target ) {
		   event.target = event.nativeEvent.srcElement || document;
	  }
	  
      // Support: Chrome 23+, Safari? <TEXT_NODE>
	  if( event.target.nodeType === 3 ) {
		  event.target = event.target.parentNode;
	  }
      
      // Если было инициированно пользовательское событие.
      if( !(ontype in window) && !(ontype in document) ) { 
        return event;
      }
      
      // Support: IE<9
	  event.metaKey = !!event.metaKey;
      
      for( h in fixHooks ) {
        if( fixHooks[ h ].event.indexOf( type ) !== -1 ) {
          _attr = _attr.concat( fixHooks[ h ].attr );
          fixFn = fixHooks[ h ].fix;
          break;
        }
      }
      
      _attr.forEach(function(attr) {
        event[ attr ] = nativeEvent[ attr ];
      });
      
      return fixFn ? fixFn(event, nativeEvent) : event;
	}
    
    // API EVENT OBJECT
	return {
	  add: bind,
      remove: unbind,
      trigger: trigger
	};
	
  })();
  
  // МЕТОДЫ КАСКАДЫ EDILS
  Edils[fn].include({
    // Исключить секцию из набора, по ее номеру, id или элементу.
    // Возвращает новый набор.
    // Предыдущий объект в свойстве prevObject.
    not: function(section) {
      var sections = toArray(this),
          t_section = typeof section,
          l, i, id;
      
      if( !(l = sections.length) ) return this;
      
      if( t_section === "number" && sections[section] ) {
        i = section;
      }
      else if( t_section === "string" && /^#\w+/.test(section) ) {
        while(l--) {
          id = "#" + sections[ l ].id;
          if( id === section ) {
            i = l;
            break;
          }
        }
      }
      else if( t_section === "object" && section && section.nodeType ) {
        i = sections.indexOf( section );
      }
      
      if( i !== undefined && i > -1 ) {
        sections.splice(i, 1);
        return new Edils[fn].init( sections, this );
      }
      return this;
    },
    
    // Возвращает предыдущий объект из этого, если он существует.
    end: function() {
      if( this.prevObject && typeof this.prevObject === "object" ) {
        var prevObj = this.prevObject,
            sections = toArray(prevObj);
        return new Edils[fn].init( sections, prevObj.prevObject );
      }
      return this;
    },
    
    // Устанавливает слайд первым в наборе.
    first: function() {
      dom.base.insertBefore( this[0], dom.base.firstChild );
      return this;
    },
    
    // Устанавливает слайд последним в наборе.
    last: function() {
      dom.base.appendChild( this[0] );
      return this;
    },
    
    before: function(pointerToSlide) {
       var type = is_type( pointerToSlide ),
           fn = {
             number: function( slide, slides, i ) {
               if( slides.length && slides[i] ) {
                 dom.base.insertBefore(slide, slides[i]);
               }
             },
             string: function( slide, slides, i ) {
               if( /^#[\w]+/.test(i) ) {
                 
                 var id = i.slice(1),
                     el = document.getElementById( id );
                 
                 if( el && (slides.indexOf( el ) > -1) ) {
                   dom.base.insertBefore(slide, el);
                 }
                 
               }
             }
           };
           
       fn[type]( this[0], querySelectorSlides(), pointerToSlide );
       return this;
    },
    
    after: function(pointerToSlide) {
      
      var type = is_type( pointerToSlide ),
          fn = {
            number: function( slide, slides, i ) {
              if( slides.length && slides[i] ) {
                dom.base.insertBefore(slide, slides[i].nextSibling);
              }
            },
            string: function( slide, slides, i ) {
              if( /^#[\w]+/.test(i) ) {
                
                var id = i.slice(1),
                    el = document.getElementById( id );
        
                if( el && (slides.indexOf( el ) > -1) ) {
                  dom.base.insertBefore(slide, el.nextSibling);
                }
              }
            }
          };
      
      fn[type]( this[0], querySelectorSlides(), pointerToSlide );
      return this;
    },
    
    attr: function(name, value) {
      
      // Если не undefined и null, вернуть значение аттрибута.
      if( value == null ) {
        return attr(this[0], name);
      }
      
      toArray( this ).forEach(function(section){
        attr(section, name, value);
      });
      
      return this;
    },
    
    id: function(id) {
      return attr("id", (typeof id === "string" && id) ? id : undefined);
    },
    
    css: function(name, value) {
      var ret;
      
      toArray( this ).forEach(function( slide ) {
        ret = css( slide, name, value );
      });
      
      return (ret && ret.nodeType) ? this : ret;
    },
    
    // Include: Action with the attribute "class".
    // Add class to your slide.
    addClass: function(classList) {
      var newList = trimmedClasses(classList), i;
      
      // Убираем из списка классов, зарезервированные классы.
      "past present future".split(" ").forEach(function(name) {
        i = newList.indexOf( name );
        if( i > -1 ) {
          newList.splice(i, 1);
        }
      });
      
      if( newList.length ) {
        // Формируем новый список.
        classList = newList.join(" ");
        toArray( this ).forEach(function(section){
          addClass(section, classList);
        });
      }
      return this;
    },
    
    removeClass: function(classList) {
      var newList = trimmedClasses(classList), i;
      
      // Убираем из списка классов, зарезервированные классы.
      "past present future".split(" ").forEach(function(name) {
        i = newList.indexOf( name );
        if( i > -1 ) {
          newList.splice(i, 1);
        }
      });
      
      if( newList.length ) {
        // Формируем новый список.
        classList = newList.join(" ");
        toArray( this ).forEach(function(section){
          removeClass(section, classList);
        });
      }
      return this;
    },
    
    /**
     * @return {boolean} true, если все элементы содержат указанный класс.
     */
    hasClass: function(className) {
      var sections = toArray( this ), i = 0;
      // Будут проверены все элементы на совпадение с классом.
      if( className ) {
        sections.forEach(function(section){
          i += hasClass(section, className) ? 1 : -1;
        });
      }
      return sections.length === i ? true : false;
    },
    
    addEvent: function(type, selector, handler) {
      if( handler == null ) {
        // ( type, fn )
        handler = selector;
        selector = undefined;
      }
      
      // Тип события только строка.
      if( typeof type === "string" && type && handler ) {
        toArray( this ).forEach(function(elem){
          Edils.event.add(elem, type, handler, selector);
        });
      }
      
      return this;
    },
    
    removeEvent: function(type, selector, handler) {
      if( typeof selector === "function" ) {
        // ( type [, fn] )
        handler = selector;
        selector = undefined;
      }
      
      toArray( this ).forEach(function(elem){
        Edils.event.remove(elem, type, handler, selector);
      });
      
      return this;
    },
    
    triggerEvent: function(type) {
      
      toArray( this ).forEach(function(elem){
        Edils.event.trigger(elem, type);
      });
      return this;
    }
    
  });
  
  // Обратные ссылки.
  Edils.extend({
    addEvent: Edils.event.add,
    removeEvent: Edils.event.remove,
    triggerEvent: Edils.event.trigger,
    animate: Edils.animate.init,
    animateStop: Edils.animate.stop
  });
  
  
  // Pre-loaded!
  (function(){
    setupDOM();
    start();
    readURL();
  })();

  function querySelectorSlides(returnArray) {
    return (returnArray === false) 
            ?          document.querySelectorAll( ".edils .slides>section" ) 
            : toArray( document.querySelectorAll( ".edils .slides>section" ) );
  }
  
  function start(opt) {
    // Установить новую конфигурацию.
    setupСonfigure(opt);

    // Установить обработчики.
    unbindEvents();
    bindEvents();
    
    // Форсируем адаптацию секций.
    adapto();
      
    // Включить автопоказ.
    autoPlay();
    
    // Обновить управление.
    updateControls();
  }
  
  function reload() {
    indexSlide = currentSlide = void(0);
    querySelectorSlides().forEach(function(section){
      addClass( section, "reload" );
    });
    readURL();
    querySelectorSlides().forEach(function(section){
      removeClass( section, "reload" );
    });
  }
  
  // Установка узлов при работе.
  function setupDOM() {
    
    dom.root = document.querySelector( ".edils" );
    dom.base = document.querySelector( ".edils>.slides" );
    
    // Create controls.
    dom.controls = createElement( "aside", {
                className: "controls",
                innerHTML: '<div class="keys">'+
                             '<span class="prev"></span>'+
                             '<span class="play"></span>'+
                             '<span class="stop"></span>'+
                             '<span class="expand"></span>'+
                             '<span class="next"></span>'+
                           "</div>"
                 }, dom.root );
    
    // Reference keys ctrl.
    dom.controlsPrev = dom.controls.querySelector( "span.prev" );
    dom.controlsPlay = dom.controls.querySelector( "span.play" );
    dom.controlsStop = dom.controls.querySelector( "span.stop" );
    dom.controlsNext = dom.controls.querySelector( "span.next" );
  dom.controlsExpand = dom.controls.querySelector( "span.expand" );
    
    dom.controlsExpand.style.display = ( support.requestFullscreen && support.cancelFullScreen ) ? "block" : "none";
    
    dom.timerBar = createElement( "aside", {
               className: "bar timer",
               innerHTML: "<span></span>"
             }, dom.root );
    
    dom.progressBar = createElement( "aside", {
               className: "bar progress",
               innerHTML: "<span></span>"
             }, dom.root );
    
    // Reference timer & progress.
    dom.timer = dom.timerBar.getElementsByTagName( "span" )[0];
    dom.progress = dom.progressBar.getElementsByTagName( "span" )[0];
  }
  
  // Установить конфигурацию.
  function setupСonfigure(opt) {
    
    removeClass( dom.root, config.animation );
    
	if( typeof opt === "object" && opt ) Edils.extend.call(config, opt);
	
    // Только линейная анимация.
    if( !support.transforms3D ) config.animation = "linear";
    
    // Установить вид анимации.
    addClass( dom.root, config.animation );
    
    // Установить скорость анимации.
    dataset( dom.root, "duration", config.duration );
    
    // Установить ось движения.
    //dataset( dom.root, "direction", config.direction === "horizontal" ? "horizontal" : config.direction === "h" ? "horizontal" : config.direction === "vertical" ? "vertical" : config.direction === "v" ? "vertical" : undefined);
    dataset( dom.root, "direction", ( config.direction === "vertical" || config.direction === "v" ) ? "vertical" : "horizontal" );
    
    // Установить направление движения слайдов.
    eval((config.reverse ? "addClass" : "removeClass"))(dom.root, "reverse");
    
    // Установить режим отображения.
    eval((config.expand ? "addClass" : "removeClass"))(dom.root, "expand");
    
    // Определим задержку для программной анимации.
    delay = transitionDuration[ config.duration ] || 0;
    
    // Прямые ссылки, не из config.
    loop = config.loop;
    auto = parseInt( config.auto, 10 ) || 0;
    
    dom.controls.style.display = config.controls ? "block" : "none";
    
    // Show/Hide timer.
    dom.timerBar.style.display = auto ? "block" : "none";
    
    // Show/Hide progress.
    if( config.progress ) {
      dom.progressBar.style.display = "block";
    }
    else {
      dom.progressBar.style.display = "none";
      // Hide timerBar if progress false.
      dom.timerBar.style.display = "none";
    }
    
  }
  
  function readURL() {
    var index, 
        hash = window.location.hash,
        path = hash.slice( 3 ).replace(/\/?$/, "");
    
    // Number || empty string.
    if ( isFinite( path ) ) {
      index = parseInt( path, 10 ) || 0;
      if ( index !== indexSlide ) slide( index );
    }
    // Only string.
    else {
      var element = document.getElementById( path );
      element ? slide( querySelectorSlides().indexOf( element ) ) : slide( 0 );
    }
  }
  
  function writeURL() {
    if( config.history ) updateHistory("!/");
    
    function updateHistory( url ) {
      if ( currentSlide && "string" === typeof currentSlide.getAttribute( "id" ) ) {
        url += currentSlide.getAttribute("id");
      }
      else if (indexSlide > 0) {
        url += indexSlide;
      }
      // write new hash.
      window.location.hash = url;
    }
    
  }
  
  function getAbsoluteHeight( element ) {
    var height = 0,
        absoluteChildren = 0;
    
    if( element ) {
      toArray( element.childNodes ).forEach( function( child ) {
        if( typeof child.offsetTop === "number" && child.style ) {
          // Определяем кол-во "абсолютных" потомков.
          if( child.style.position === "absolute" ) ++absoluteChildren;
          height = Math.max( height, child.offsetTop + child.offsetHeight );
        }
      });
      
      // Если потомков нет, берем высоту элемента.
      if( absoluteChildren === 0 ) {
        height = element.offsetHeight;
      }
    }
    return height;
  }
  
  function adapto(sectionWidth, sectionHeight, sectionExpand, base) {
    
    //if( isOverview() ) return;
    
    var 
    args = arguments,
    offsetWidth  = dom.root.offsetWidth,
    offsetHeight = dom.root.offsetHeight,
    margin = config.margin,
    middle = config.middle,
    hasExpand, transform, data, sections;

    sectionWidth  = sectionWidth  || config.width;
    sectionHeight = sectionHeight || config.height;
    sectionExpand = sectionExpand || config.expand;
    base = base || dom.base;
    
    hasExpand = hasClass(base, "expand");
    
    // Коэфицент отступа не учитывается, если содержимое 
    // нужно растянуть во весь экран.
    offsetWidth  -= sectionExpand ? 0 : offsetHeight * margin;
    offsetHeight -= sectionExpand ? 0 : offsetHeight * margin;
    
    // Ширина слайда может быть задана в процентах.
    if( typeof sectionWidth === "string" && /%$/.test( sectionWidth ) ) {
      sectionWidth = parseInt(sectionWidth, 10) / 100 * offsetWidth;
    }
    
    // Высота слайда может быть задана в процентах.
    if( typeof sectionHeight === "string" && /%$/.test( sectionHeight ) ) {
      sectionHeight = parseInt(sectionHeight, 10) / 100 * offsetHeight;
    }
    
    // Применить размеры.
    base.style.width  = sectionWidth + "px";
    base.style.height = sectionHeight + "px";
      
    // Если содержимое должно быть растянуто во весь экран.
    if( sectionExpand && ! hasExpand ) {
      addClass(base, "expand");
    }
    if( ! sectionExpand && hasExpand ) {
      removeClass(base, "expand");
    }
    
    // Задать масштабирование. 
    // Если высота указана в %, масштаб задействован не будет!
    // Определить масштаб контента под доступное пространство.
    scale = Math.min( offsetWidth / sectionWidth, offsetHeight / sectionHeight );
      // Соблюсти масштабирование относительно настроек.
    scale = Math.max( scale, minScale );
    scale = Math.min( scale, maxScale );
    
    // IE8 при использовании свойства zoom и абсолютном позиционировании 
    // элемента контейнера <div class="slides">, масштабируются только 
    // дочерние элементы, в то время как сам контейнер не масштабируется.
    // При использовании фильтра
    // -ms-filter: "progid:DXImageTransform.Microsoft.Matrix(M11=scale, M12=0, M21=0, M22=scale, SizingMethod='auto expand')"
    // область видимости дочернх элементов (section), которая выходит за границы 
    // элемнета контейнера будет скрыта.
    // Поддержка трансформации 2D отсутствует в IE8 и подобных ему средах.
    if( !support.ie || support.transforms2D ) {
      
      if( typeof base.style.zoom !== "undefined" && !navigator.userAgent.match( /(iphone|ipod|ipad|android)/gi ) ) {
        base.style.zoom = scale;
      }
      else {
        // CSS3 (Opera, FF, Android, iOS).
        transform = "translate(-50%, -50%) scale(" + scale + ") translate(50%, 50%)";
        css(base, {
          WebkitTransform: transform,
          MozTransform: transform,
          msTransform: transform,
          OTransform: transform,
          transform: transform
        });
      }
      
    }
    
    // Находим все секции, которые входят в текущее основание.
    sections = toArray( base.querySelectorAll( "section" ) );
    
    sections.forEach(function( section ){
      // Обходим только прямых потомков для основания.
      if( ! hasClass(section.parentNode, "slides") ) {
        return;
      }
      
      if( !args.length ) {
        
        data = {
          w: dataset(section, "width"),
          h: dataset(section, "height"),
          e: "string" === typeof dataset(section, "expand"),
          p: section.parentNode.parentNode
        };
        
        if( data.w || data.h || data.e ) {
          
          if( hasClass(data.p, "edils") ) {
            data.p = null;
            data.p = createElement("div", {className: "slides"});
            data.p.appendChild( section.cloneNode(true) );
            section.parentNode.replaceChild( data.p, section );
          }
          else {
            data.p = section.parentNode;
          }
          
          return adapto.call(this, data.w, data.h, data.e, data.p);
        }
      }
      
      // Пропустить отключенные элементы.
      if( section.style.display !== "none" ) {
        // Включить вертикальное центрироваине.
        section.style.top = middle ? Math.max( - (getAbsoluteHeight( section ) / 2), -sectionHeight / 2 ) + "px" : "";
      }
    }, this);
    
    updateProgress();
  }
  
  function slide( i ) {
    var prevSlide;
    
    indexSlide = updateSlides( i );
    prevSlide = currentSlide;
    currentSlide = querySelectorSlides()[ indexSlide ];
    
    // Адаптировать слайды под конфигурацию.
    adapto();
    updateControls();
    updateProgress();
    writeURL();
    
    // Инициировать событие "transition" для текущего слайда.
    // Опускать инициирование, если происходит первая инициализация.
    if( prevSlide ) {
      Edils.triggerEvent( currentSlide, "transition" );
    }
  }
  
  // Прокрутить главный скролл с заданному слайду.
  function scrollTo( i ) {
    
  }
  
  function updateSlides( i ) {
    var distance, 
        sections = querySelectorSlides(),
        section,
        length = sections.length;

    if ( !length ) return 0;
    
    if( loop ) {
      if( Number.MAX_VALUE === i ) {
        i = length - 1;
      }
      else {
        i %= length;
        if( i < 0 ) i = length + i;
      }
    }
    
    // Если номер слайда превышает общее кол-во слайдов.
    i = Math.max( Math.min( i , length - 1 ), 0 );
    section = sections[ i ];
    
    sections.forEach(function( section, index ) {
      
      removeClass(section, "past present future");
      // http://www.whatwg.org/specs/web-apps/current-work/multipage/editing.html#the-hidden-attribute
      section.setAttribute( "hidden", "" );
      
      if( index < i ) addClass(section, "past");
      if( index > i ) addClass(section, "future");
      // Если секция имеет свою собственную обертку, то она будет накладываться 
      // поверх предыдущей секции, так как ее значение z-index перекрывает 
      // значение z-index обертки предыдущей секции.
      if( index !== i && hasClass(section.parentNode.parentNode, "slides") ) {
        section.parentNode.style.zIndex = 0;
      }
      
      // Отключим элементы, которые расположены дальше заданного растояния с учетом петли между первым и последним слайдом.
      // https://developer.mozilla.org/en-US/docs/Web/CSS/display
      distance = Math.abs( ( index - i ) % ( length - config.distanceToHidden ) ) || 0;
      section.style.display = distance > config.distanceToHidden ? "none" : "block";
      
    });
    // parenNode либо обертка, либо общая обертка. Значения не имеет.
    section.parentNode.style.zIndex = 1;
    addClass(section, "present");
    section.removeAttribute( "hidden" );
      
    return i;
  }
  
  function updateControls() {
    
    // Деактивируем все элементы.
    toArray( dom.controls.getElementsByTagName( "span" ) ).forEach(function( elem ) {
      removeClass(elem, "enabled");
    });
    // Активируем расширитель.
    addClass(dom.controlsExpand, "enabled");
    
    var prev = indexSlide > 0 || loop,
        next = indexSlide < querySelectorSlides().length - 1 || loop;
    
    if( prev ) addClass(dom.controlsPrev, "enabled");
    if( next ) addClass(dom.controlsNext, "enabled");
    
    
    if( auto ) {
      dom.controlsStop.style.display = "block";
      dom.controlsPlay.style.display = "block";
      
      if( next && !isStopped() ) {
        addClass( dom.controlsStop, "enabled" );
      }
      else {
        addClass( dom.controlsPlay, "enabled" );
      }
      
    }
    else {
      dom.controlsStop.style.display = "none";
      dom.controlsPlay.style.display = "none";
      
      dom.controlsStop.style.border = "none";
      dom.controlsPlay.style.border = "none";
    }
    
  }
  
  
  
  
  
  
  
  
  
  function innerWidth() {
    return window.innerWidth || document.body.clientWidth;
  }
  
  function updateProgress() {
    var l, i, w = innerWidth(),
        sections = querySelectorSlides();

    l = i = sections.length;
    while( i-- ) {
      if( hasClass( sections[ i ], "present" ) ) break;
    }
    
    w = ( i / ( l-1 ) ) * w;
    Edils.animate( dom.progress, { width: w }, delay, "easeOutCirc" );
  }
  
  function updateTimer() {
    
    if( indexSlide < querySelectorSlides().length - 1 || loop ) {
      
      var w = innerWidth(),
          done = function() { this.style.width = 0; };
      
      // Вывести таймер на 0, если он был остановлен через stopTimer().
      Edils.animate( dom.timer, { width: 0 }, 0 );
      Edils.animate( dom.timer, { width: w }, auto, null, done );
    }
    else {
      // Остановить автопоказ, если слайды кончились.
      stopPlay();
    }
  }
  
  // Остановить анимацию таймера.
  function stopTimer() {
    Edils.animateStop( dom.timer );
  }
  
  function clearTimeoutPlay() {
    clearTimeout( autoPlayTimeout );    autoPlayTimeout = 0;
    clearTimeout( nextPlayTimeout );    nextPlayTimeout = 0;
    clearTimeout( updateTimerTimeout ); updateTimerTimeout = 0;
  }
  
  function autoPlay( delay ) {
    clearTimeoutPlay();
    
    // Учитываем задержку самой анимации.
    if( typeof delay === "number" ) {
      autoPlayTimeout = setTimeout( autoPlay, delay );
    }
    else if( auto ) {
      updateTimerTimeout = setTimeout( updateTimer, 0 );
      nextPlayTimeout    = setTimeout( nextPlay, auto );
    }
  }
  
  // Останавливаю показ.
  function stopPlay() {
    addClass( dom.root, "stopped" );
    clearTimeoutPlay();
  }
  
  function nextPlay() {
    clickedNext();
    autoPlay( delay );
  }
  
  function clickedNext() {
    slide( indexSlide + 1 );
  }
  
  function clickedPrev() {
    slide( indexSlide - 1 );
  }
  
  function clickedStop() {
    // Если стоим, то и незачем тормозить.
    if( isStopped() ) return ;
    
    stopPlay();
    stopTimer();
    updateControls();
  }
  
  function clickedPlay() {
    // Если не стоим, то и незачем трогать.
    if( !isStopped() ) return ;
    
    removeClass( dom.root, "stopped" );
    updateControls();
    
    // Продолжить, если еще возможно.
    if( indexSlide < querySelectorSlides().length - 1 || loop ) {
      return autoPlay();
    }
    // Продолжить заново.
    slide( 0 );
    autoPlay( delay );
  }
  
  function isStopped() {
    return hasClass( dom.root, "stopped" );
  }
  
  // https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Using_full_screen_mode
  // http://demosthenes.info/blog/708/Introducing-the-HTML5-FullScreen-API
  // http://caniuse.com/fullscreen
  function clickedFullScreen() {
    
    var isFullScreen = !document.fullscreenElement && 
                       // https://developer.mozilla.org/en-US/docs/Web/API/document.mozFullScreenElement
                       !document.mozFullScreenElement && 
                       // https://developer.apple.com/library/safari/documentation/UserExperience/Reference/DocumentAdditionsReference/DocumentAdditions/DocumentAdditions.html#//apple_ref/javascript/instp/Document/webkitIsFullScreen
                       !document.webkitCurrentFullScreenElement &&
                       !document.webkitFullscreenElement &&
                       // http://msdn.microsoft.com/ru-ru/library/ie/dn254937(v=vs.85).aspx
                       !document.msFullscreenElement;
    
    if( isFullScreen ) {
      if( support.requestFullscreen )
	      support.requestFullscreen.call( document.body );
    }
    else {
      if( support.cancelFullScreen )
          support.cancelFullScreen.call( document );
    }
    
  }
  
  function isOverview() {
    return hasClass( document.body, "overview" );
  }
  
  
  // Перестроить макет.
  function enableOverview() {
    // Остановить автопоказ если нужно.
    clickedStop();
    
    // Удалить обработчики всех событий.
    unbindEvents();
    
    // Зарегестрировать ед. обработчик для выхода из режима.
    Edils.addEvent(document, "keydown", bindExitOverview);
    
    addClass( document.body, "overview" );
  }
  
  // Перестроить макет.
  function disableOverview() {
    
    // Зарегестрировать ед. обработчик для выхода из режима.
    Edils.removeEvent(document, "keydown", bindExitOverview);
    
    // Установить обработчики всех событий.
    bindEvents();
    
    removeClass( document.body, "overview" );
  }
  
  // Переключить макет.
  function toggleOverview() {
    isOverview() ? disableOverview() : enableOverview();
   }
  
  // 
  function bindExitOverview(event) {
    if( event.which === 27 || event.which === 79 ) {
      disableOverview();
      event.preventDefault();
    }
  }
  
  // +++++++++++++++++++++++++++++++ HANDLERS +++++++++++++++++++++++++++++++ //
  
  function bindWindowLoadedHandler(event) { adapto(); }
  function bindWindowResizingHandler() { adapto();  }
  function bindWindowHashchangeHandler() { readURL(); }
  function bindControlsClickedNextHandler(event) { clickedNext(); }
  function bindControlsClickedPrevHandler(event) { clickedPrev(); }
  function bindControlsClickedPlayHandler(event) { clickedPlay(); }
  function bindControlsClickedStopHandler(event) { clickedStop(); }
  function bindControlsClickedExpandHandler(event) { clickedFullScreen(); }
  function bindDocumentKeyDownHandler(eventObject) {
  
	var hasFocus = !!( document.activeElement && ( document.activeElement.type || document.activeElement.href || document.activeElement.contentEditable !== "inherit" ) );
	// Пропустить, если есть элемент имеющий фокус или нажата одна из системных клавиш.
	if( hasFocus || eventObject.shiftKey || eventObject.ctrlKey || eventObject.altKey || eventObject.metaKey ) return;
	
    switch( eventObject.which ) {
      // Page Up <Вперед>
	  case 33: clickedNext(); break;
      // Page Down <Назад>
	  case 34: clickedPrev(); break;
	  // Home <В начало>
      case 36: slide( 0 ); break;
      // End <В конец> (The largest positive representable number)
      case 35: slide( Number.MAX_VALUE ); break;
      // Space, Pause/Break <Начать|Остановить автопоказ>
      case 32: case 19: if( auto ) { isStopped() ? clickedPlay() : clickedStop(); } break;
      // Enter <Toggle FullScreen>
      // TODO IE11 не работает!!!
	  case 13: clickedFullScreen(); break;
      // ESC
      case 27: case 79: toggleOverview(); break;
	}
  }
  
  
  // +++++++++++++++++++++++++ BIND & UNBIND EVENTS +++++++++++++++++++++++++ //
  function bindEvents() {
    
    Edils.addEvent(window, "load", bindWindowLoadedHandler);
    Edils.addEvent(window, "resize", bindWindowResizingHandler);
    Edils.addEvent(window, "hashchange", bindWindowHashchangeHandler); // ie8
    
    "click touchstart".split(" ").forEach(function(type) {
      Edils.addEvent(dom.controlsNext, type, bindControlsClickedNextHandler);
      Edils.addEvent(dom.controlsPrev, type, bindControlsClickedPrevHandler);
      Edils.addEvent(dom.controlsPlay, type, bindControlsClickedPlayHandler);
      Edils.addEvent(dom.controlsStop, type, bindControlsClickedStopHandler);
      
      if( support.requestFullscreen && support.cancelFullScreen ) {
        Edils.addEvent(dom.controlsExpand, type, bindControlsClickedExpandHandler);
      }
    });
    
    if( config.keyboard ) {
      Edils.addEvent(document, "keydown", bindDocumentKeyDownHandler);
    }
  }
  
  function unbindEvents() {
    
    Edils.removeEvent(window, "load", bindWindowLoadedHandler);
    Edils.removeEvent(window, "resize", bindWindowResizingHandler);
    Edils.removeEvent(window, "hashchange", bindWindowHashchangeHandler);
    
    "click touchstart".split(" ").forEach(function(type) {
      Edils.removeEvent(dom.controlsNext, type, bindControlsClickedNextHandler);
      Edils.removeEvent(dom.controlsPrev, type, bindControlsClickedPrevHandler);
      Edils.removeEvent(dom.controlsPlay, type, bindControlsClickedPlayHandler);
      Edils.removeEvent(dom.controlsStop, type, bindControlsClickedStopHandler);
      
      Edils.removeEvent(dom.controlsExpand, type, bindControlsClickedExpandHandler);
    });
    
	Edils.removeEvent(document, "keydown", bindDocumentKeyDownHandler);
  }
  
  return Edils;
})(window);