(function(doc, win) {
  var HOST = location.host;
  var pathname = location.pathname + (location.search || '');
  var result = doc.getElementById('result');

  function SiteScript() {
    var title = doc.getElementsByTagName('title').item(0).textContent;
    this.ap = new AppendPage(location.href, title);
    this.elevator = new Elevator;
    this.add_event();
  }

  (function($) {
    $.add_event = function()  {
      doc.addEventListener('DOMContentLoaded', this.loaded.bind(this), false);
    };

    $.init = function() {
      while (result.hasChildNodes())
        result.removeChild(result.firstChild);
    };

    $.loaded = function() {
      var form = doc.getElementsByTagName('form').item(0);
      var text_field = doc.getElementById('tumblr_username');
      text_field.setAttribute('value', 'press any tumblr username');
      text_field.setAttribute('class', 'initial_value');
      if (this.ap.username) {
        text_field.value = this.ap.username;
        text_field.removeAttribute('class');
      }
      text_field.onfocus = function() {
	var initial_value = text_field.getAttribute('value');
        if (text_field.value === initial_value) {
          text_field.value = '';
          text_field.removeAttribute('class');
        }
      };
      form.onsubmit = function() {  
        this.init();
        text_field.blur();
        this.ap.username = text_field.value;
        this.ap.page = 1;
        this.ap.request();
        return false;
      }.bind(this);
    };
  })(SiteScript.prototype);

  function AppendPage(uri, title) {
    this.uri = uri;
    this.page_title = title;
    this.init();
  }

  (function($) {
    var _expr = /http:\/\/[^/]+\/(\w+)?(?:\?page=(\d+))?/;

    Object.defineProperty($, 'username', {
      get: function() {
        return _expr.exec(this.uri)[1];
      },
      set: function(username) {
        this.uri = this.get_api_uri(username, this.page);
        return username;
      }
    });

    Object.defineProperty($, 'page', {
      get: function() {
        return (_expr.exec(this.uri)[2] || 1) * 1;
      },
      set: function(page) {
        this.uri = this.get_api_uri(this.username, page);
        return page;
      }
    });

    $.init = function() {
      if (this.username)
        this.add_event();
    };

    $.add_event = function() {
      var self = this;
      win.addEventListener('scroll', function() {
        var func = arguments.callee;
        self.window_scroll(function() {
          win.removeEventListener('scroll', func);
        });
      }, false);
    };

    $.window_scroll = function(remove_event) {
      var sections = result.getElementsByTagName('section');
      if (sections.length === 0)
        remove_event();
      if (win.scrollY < sections.item(sections.length - 2).offsetTop)
        return;
      remove_event();
      this.load_next();
    };

    $.load_next = function() {
      this.page = this.page + 1;
      this.request();
    };

    $.request = function() {
      var req = new XMLHttpRequest();
      req.onreadystatechange = function() {
        if (req.readyState !== 4 || req.status !== 200)
          return;
        var res = req.responseXML;
        var sections = res.querySelectorAll('#result > section');
        this.page_title = res.getElementsByTagName('title').item(0).textContent;
        this.append_sections(sections);
        this.add_event();
      }.bind(this);
      req.open('GET', this.uri);
      req.send(null);
    };

    $.append_sections = function(sections) {
      for (var i=0,len=sections.length; i<len; i++) {	  
        var section = sections.item(i);
        result.appendChild(section);
      }
      this.push_state();
    };

    $.push_state = function() {
      doc.getElementsByTagName('title').item(0).textContent = this.page_title;
      if ('pushState' in win.history)
        win.history.pushState({}, this.page_title, this.uri);
    };

    $.get_api_uri = function(username, page) {
      var path = '/' + username;
      if (page > 1)
        path += '?page=' + page;
      return 'http://' + HOST + path;
    };
  })(AppendPage.prototype);

  function Elevator() {
    this.init();
  }

  (function($) {
    Object.defineProperty($, 'sections', {
      get: function() {
        var sections = result.getElementsByTagName('section');
        return Array.prototype.slice.call(sections);
      }
    });

    Object.defineProperty($, 'section_positions', {
      get: function() {
        var ret = [];
        this.sections.forEach(function(section) {
          ret.push(section.offsetTop);
        });
        return ret;
      }
    });

    $.init = function() {
      return;
    };

    $.current_section = function() {
      var pos = win.scrollY;
      var _ = this.section_positions;
      _.sort(function(a, b) {
        return Math.abs(a - pos) - Math.abs(b - pos);
      });
      return this.sections[this.section_positions.indexOf(_[0])];
    };

    $.go = function(num) {
      var current = this.current_section();
      var i = this.section_positions.indexOf(current.offsetTop);
      i = i + num;
      if (i < 0 || i > this.sections.length - 1)
        return -1;
      scroll(0, this.section_positions[i]);
      return this.sections[i];
    };

    $.prev = function() {
      return this.go(-1);
    };

    $.next = function() {
      return this.go(+1);
    };
  })(Elevator.prototype);

  win.ss = new SiteScript();
})(window.document, window);
