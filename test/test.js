var chai = require('chai');
var expect = chai.expect;

var React = require('react');
var ReactCompat = require('./react-compat');

var PropTypes = ReactCompat.PropTypes;
var createClass = ReactCompat.createClass;

var createFragment = require('react-addons-create-fragment');

var sd = require('../skin-deep');

var $ = React.createElement;

describe("skin-deep", function() {

  describe("getRenderOutput", function() {

    it("should render a ReactElement", function() {
      var tree = sd.shallowRender($('h1', { title: "blah" }, "Heading!"));
      var vdom = tree.getRenderOutput();
      expect(vdom).to.have.property('type', 'h1');
      expect(vdom.props).to.have.property('title', 'blah');
      expect(vdom.props).to.have.property('children', 'Heading!');
    });

    it("should render a React Component", function() {
      var Component = createClass({
        render: function() {
          return $('h1', { title: "blah" }, "Heading!");
        }
      });
      var tree = sd.shallowRender($(Component));
      var vdom = tree.getRenderOutput();
      expect(vdom).to.have.property('type', 'h1');
      expect(vdom.props).to.have.property('title', 'blah');
      expect(vdom.props).to.have.property('children', 'Heading!');
    });
  });

  describe.skip("reRender", function() {
    it("should reRender a React Component without context", function() {
      var Component = createClass({
        render: function() {
          return $('h1', {}, this.props.thing);
        }
      });
      var tree = sd.shallowRender($(Component, { thing: 'A' }));
      var vdom1 = tree.getRenderOutput();
      expect(vdom1).to.have.property('type', 'h1');
      expect(vdom1.props).to.have.property('children', 'A');

      tree.reRender($(Component, { thing: 'B' }));
      var vdom2 = tree.getRenderOutput();
      expect(vdom2).to.have.property('type', 'h1');
      expect(vdom2.props).to.have.property('children', 'B');
    });

    it("should reRender a React Component with context", function() {
      var Component = createClass({
        contextTypes: { checkMe: PropTypes.string },
        render: function() {
          return $('h1', {}, this.props.thing, this.context.checkMe);
        }
      });
      var tree = sd.shallowRender(
        function() { return $(Component, { thing: 'A' }); }
      , { checkMe: 'Context!' });
      var vdom1 = tree.getRenderOutput();

      expect(vdom1).to.have.property('type', 'h1');
      expect(vdom1.props.children).to.eql(['A', 'Context!']);

      tree.reRender(
        function() { return $(Component, { thing: 'B' }); },
        { checkMe: 'Context!' }
      );
      var vdom2 = tree.getRenderOutput();
      expect(vdom2).to.have.property('type', 'h1');
      expect(vdom2.props.children).to.eql(['B', 'Context!']);
    });
  });

  describe("getMountedInstance", function() {

    it("should provide the React Component instance", function() {
      var Component = createClass({
        render: function() {
          return $('h1', { title: "blah" }, "Heading!");
        },
        aMethod: function() { return 1; }
      });
      var tree = sd.shallowRender($(Component));
      var instance = tree.getMountedInstance();

      expect(instance.aMethod).to.be.a('function');
      expect(instance.aMethod()).to.eql(1);
    });

    it("shouldn't work on non-component renders", function() {
      var tree = sd.shallowRender($('h1', {}));
      expect(function() {
        tree.getMountedInstance();
      }).to.throw();
    });

  });

  describe.skip("findNode", function() {
    var Widget = createClass({
      displayName: 'Widget',
      render: function() { return 'widget'; }
    });

    var ReduxWidget = createClass({
      displayName: 'Connect(Widget)',
      render: function() { return 'redux-widget'; }
    });
    function Widget2() { this.state = {}; }
    Widget2.prototype = Object.create(React.Component);
    Widget2.prototype.render = function() { return 'widget'; };
    var tree = sd.shallowRender(
      $('div', {},
        $('div', {}, 'objection!'),
        $('div', { id: "def" }, "DEF"),
        $('div', {},
          $('div', {}, "objection!"),
          $('object', {}, "objection!"),
          'hello',
          $('div', { className: "abc-123" }, "ABC 123"),
          $('div', { className: "space-after abc-123" }, "Second ABC 123"),
          $('div', { className: "abc-123 space-before" }, "Third ABC 123"),
          [$('div', { className: "abc", key: "1" }, "ABC")],
          $(Widget, {}),
          $(Widget2, {}),
          $(ReduxWidget, {})
        )
      )
    );

    it("should find a node in tree by className", function() {
      var abc = tree.findNode(".abc");
      expect(abc).to.have.property('type', 'div');
      expect(abc.props).to.have.property('children', 'ABC');
    });

    it("should find a node with multiple classes by className", function() {
      var spaceAfter = tree.findNode(".space-after");
      expect(spaceAfter).to.have.property('type', 'div');
      expect(spaceAfter.props).to.have.property('children', 'Second ABC 123');

      var spaceBefore = tree.findNode(".space-before");
      expect(spaceBefore).to.have.property('type', 'div');
      expect(spaceBefore.props).to.have.property('children', 'Third ABC 123');
    });

    it("should find a node in tree by id", function() {
      var abc = tree.findNode("#def");
      expect(abc).to.have.property('type', 'div');
      expect(abc.props).to.have.property('children', 'DEF');
    });

    it("should find a node in tree by tagname", function() {
      var abc = tree.findNode("object");
      expect(abc).to.have.property('type', 'object');
      expect(abc.props).to.have.property('children', 'objection!');
    });

    it("should find a node in tree by component displayName", function() {
      var abc = tree.findNode("Widget");
      expect(abc).to.have.property('type', Widget);
    });

    it("should find a node in tree by fancy displayName", function() {
      var abc = tree.findNode("Connect(Widget)");
      expect(abc).to.have.property('type', ReduxWidget);
    });

    it("should find a node in tree by component class name", function() {
      var abc = tree.findNode("Widget2");
      expect(abc).to.have.property('type', Widget2);
    });

    it("should return false when node not found", function() {
      expect(tree.findNode(".def")).to.eql(false);
      expect(tree.findNode("#abc")).to.eql(false);
    });

    describe("conditionals", function() {
      before(function() {
        tree = sd.shallowRender(
          $('div', {},
            true && $('a', {}, 'A'),
            false && $('b', {}, 'B'),
            0 && $('c', {}, 'C'),
            "" && $('d', {}, 'D'),
            undefined && $('e', {}, 'E'),
            null && $('f', {}, 'F'),
            1 && $('g', {}, 'G'),
            "abc" && $('h', {}, 'H')
          )
        );
      });

      it("should find true && item", function() {
        expect(tree.findNode('a')).to.have.property('type', 'a');
      });
      it("should not find false && item", function() {
        expect(tree.findNode('b')).to.eql(false);
      });
      it("should not find 0 && item", function() {
        expect(tree.findNode('c')).to.eql(false);
      });
      it("should not find '' && item", function() {
        expect(tree.findNode('d')).to.eql(false);
      });
      it("should not find undefined && item", function() {
        expect(tree.findNode('e')).to.eql(false);
      });
      it("should not find null && item", function() {
        expect(tree.findNode('f')).to.eql(false);
      });
      it("should find 1 && item", function() {
        expect(tree.findNode('g')).to.have.property('type', 'g');
      });
      it("should find 'abc' && item", function() {
        expect(tree.findNode('h')).to.have.property('type', 'h');
      });
    });
  });

  describe.skip("textIn", function() {
    var tree = sd.shallowRender(
      $('div', {},
        $('div', { className: "abc" }, "ABC"),
        $('div', { id: "def" }, "DEF"),
        $('object', {}, "objection!")
      )
    );
    it("should grab text in selector", function() {
      expect(tree.textIn(".abc")).to.eql("ABC");
      expect(tree.textIn("#def")).to.eql("DEF");
      expect(tree.textIn("object")).to.eql("objection!");
    });
  });

  describe.skip("fillField", function() {
    var tree;
    var Component = createClass({
      getInitialState: function() {
        return { "username": "" };
      },
      getNickname: function() {
        return React.findDOMNode(this.refs.nickname).value;
      },
      render: function() {
        return $('form', {},
          $('input', {
            type: "text", id: "username",
            value: this.state.username, onChange: function(event) {
              this.setState({ "username": event.target.value });
            }.bind(this)
          }),
          $('input', {
            type: "text", ref: "nickname", className: "nickname"
          })
        );
      }
    });
    beforeEach(function() {
      tree = sd.shallowRender($(Component));
    });

    it("should set value of controlled text field", function() {
      expect(tree.findNode("#username").props)
        .to.have.property("value", "");

      tree.fillField("#username", "glenjamin");

      expect(tree.findNode("#username").props)
        .to.have.property("value", "glenjamin");
    });

    it("should no-op on field without change handler", function() {
      var field = tree.findNode(".nickname");

      tree.fillField(".nickname", "glenjamin");

      expect(tree.findNode(".nickname")).to.eql(field);
    });

    it.skip("should set value of uncontrolled text field", function() {
      // Can this be done?
    });

    it("should throw if field not found", function() {
      expect(function() {
        tree.fillField("#losername", "not-glenjamin");
      }).to.throw(/unknown/i);
    });
  });

  describe.skip("toString", function() {
    it("should give HTML", function() {
      var tree = sd.shallowRender($('h1', { title: "blah" }, "Heading!"));
      expect(String(tree)).to.eql('<h1 title="blah">Heading!</h1>');
    });
  });

  describe("props", function() {
    it("should expose props", function() {
      var tree = sd.shallowRender($('h1', { title: "blah" }, "Heading!"));
      expect(tree.props).to.eql({ title: "blah", children: "Heading!" });
    });
  });

  describe("text", function() {
    var Widget = createClass({
      displayName: 'Widget',
      render: function() { return 'Should not see'; }
    });
    it("should give a textual representation of the tree", function() {
      var tree = sd.shallowRender($('h1', { title: "blah" },
        "Heading! ",
        $('div', { title: "blah" },
          5, $('hr'),
          ' Some text. ',
          'More text. ',
          [React.createElement(Widget, { key: 1 }),
            React.createElement(Widget, { key: 2 })])
      ));
      expect(tree.text())
        .to.eql('Heading! 5 Some text. More text. <Widget /><Widget />');
    });
    it("Should render a single zero child correctly", function() {
      var tree = sd.shallowRender($('h1', {}, 0));
      expect(tree.text()).to.eql('0');
    });
  });

  describe("subTree", function() {
    var Widget = createClass({
      displayName: 'Widget',
      render: function() { return null; }
    });
    var ReduxWidget = createClass({
      displayName: 'Connect(Widget)',
      render: function() { return 'redux-widget'; }
    });
    var tree = sd.shallowRender(
      $('div', {},
        $('div', { id: "def", className: "abc" },
          "DEF", $('hr')),
        $('div', { id: "abc" },
          $('div', {}, "objection!"),
          $('object', {}, "objection!"),
          'hello',
          [$('div', { id: "abc2", className: "abc", key: "1" }, "ABC")]
        ),
        $('div', { id: 'wut', prop: 'val' }),
        $('div', { className: 'yup', prop: 'val' }),
        $(Widget, {}, "stuff"),
        $(ReduxWidget, {})
      )
    );
    it("should return false when not found", function() {
      var abc = tree.subTree("#blah");
      expect(abc).to.eql(false);
    });
    it("should grab a subtree by * selector + props", function() {
      var wut = tree.subTree("*", { id: 'wut', prop: "val" });
      expect(wut).to.be.an('object');
      expect(wut.getRenderOutput().props).to.have.property("id", "wut");
    });
    it("should grab a subtree by id selector", function() {
      var abc = tree.subTree("#abc");
      expect(abc).to.be.an('object');
      expect(abc.getRenderOutput().props).to.have.property("id", "abc");
    });
    it("should grab a subtree by id selector + props", function() {
      var wut = tree.subTree("#wut", { id: 'wut', prop: "foo" });
      expect(wut).to.eql(false);

      var wut2 = tree.subTree("#wut", { id: 'wut', prop: "val" });
      expect(wut2).to.be.an('object');
      expect(wut2.getRenderOutput().props).to.have.property("id", "wut");
    });
    it("should grab a subtree by class selector", function() {
      var abc = tree.subTree(".abc");
      expect(abc).to.be.an('object');
      expect(abc.getRenderOutput().props).to.have.property("className", "abc");
    });
    it("should grab a subtree by class selector + props", function() {
      var yup = tree.subTree(".yup", { className: 'yup', prop: "foo" });
      expect(yup).to.eql(false);

      var yup2 = tree.subTree(".yup", { className: 'yup', prop: "val" });
      expect(yup2).to.be.an('object');
      expect(yup2.getRenderOutput().props).to.have.property("className", "yup");
    });
    it("should grab a subtree by tag selector", function() {
      var abc = tree.subTree("object");
      expect(abc).to.be.an('object');
      expect(abc.getRenderOutput().props)
        .to.have.property("children", "objection!");
    });
    it("should grab a subtree by tag selector + props", function() {
      var subtree = tree.subTree("object", { children: 'not objection!' });
      expect(subtree).to.eql(false);

      var subtree2 = tree.subTree("object", { children: 'objection!' });
      expect(subtree2).to.be.an('object');
      expect(subtree2.getRenderOutput().type).to.eql('object');
    });
    it("should grab a subtree by component name", function() {
      var abc = tree.subTree("Widget");
      expect(abc).to.be.an('object');
      expect(abc.getRenderOutput().props)
        .to.have.property("children", "stuff");
    });
    it("should find a node in tree by fancy displayName", function() {
      var abc = tree.subTree("Connect(Widget)");
      expect(abc).to.have.property('type', ReduxWidget);
    });
    it("should grab a subtree by component type", function() {
      var abc = tree.subTree(Widget);
      expect(abc).to.be.an('object');
      expect(abc.props).to.have.property("children", "stuff");
    });
    it("should grab a subtree by component + props", function() {
      var subtree = tree.subTree("Widget", { children: 'not stuff' });
      expect(subtree).to.eql(false);

      var subtree2 = tree.subTree("Widget", { children: 'stuff' });
      expect(subtree2).to.be.an('object');
      expect(subtree2.getRenderOutput().type).to.eql(Widget);
    });
    it("should grab a subtree by component + props", function() {
      var subtree = tree.subTree(Widget, { children: 'not stuff' });
      expect(subtree).to.eql(false);

      var subtree2 = tree.subTree(Widget, { children: 'stuff' });
      expect(subtree2).to.be.an('object');
      expect(subtree2.type).to.eql(Widget);
    });
    it("should grab first subtree when using function matcher", function() {
      var subtree = tree.subTree('*', function(node) {
        return node.key == "1";
      });
      expect(subtree).to.be.an('object');
      expect(subtree.props.id).to.eql('abc2');
    });
    describe("methods", function() {
      var subTree;
      beforeEach(function() {
        subTree = tree.subTree('#abc');
      });
      it("should have same methods as main tree", function() {
        expect(Object.keys(tree)).to.eql(Object.keys(subTree));
      });
      it("should provide scoped subTree()", function() {
        expect(subTree.subTree('.abc').text()).to.eql("ABC");
      });
      it("should provide scoped text()", function() {
        expect(subTree.text()).to.eql("objection!objection!helloABC");
      });
      it("should expose .props", function() {
        expect(tree.subTree('#wut').props).to.eql({
          id: 'wut', prop: 'val'
        });
      });
    });
  });

  describe("subTree", function() {
    var Widget = createClass({
      displayName: 'Widget',
      render: function() { return null; }
    });
    var tree = sd.shallowRender(
      $('div', {},
        $('div', { id: "def", className: "abc" },
          "DEF", $('hr', {})),
        $('div', { id: "abc", more: false },
          $('div', {}, "objection!"),
          $('object', { id: "bob", prop: 'val' }, "objection!"),
          'hello',
          [$('div', { id: "abc2", className: "abc", key: "1" }, "ABC")]
        ),
        $('div', { id: 'wut', prop: 'val' }),
        $('div', { className: 'yup', prop: 'val' }),
        $(Widget, { test: 'abc', prop: 'val', more: true }, "stuff")
      )
    );
    it("should return false when not found", function() {
      var abc = tree.subTree("#blah");
      expect(abc).to.eql(false);
    });
    it("should grab a subtree by * selector + partial props", function() {
      var wut = tree.subTree("*", { id: "wut" });
      expect(wut).to.be.an('object');
      expect(wut.getRenderOutput().props).to.have.property("prop", "val");
    });
    it("should grab a subtree by id selector", function() {
      var abc = tree.subTree("#abc");
      expect(abc).to.be.an('object');
      expect(abc.getRenderOutput().props).to.have.property("id", "abc");
    });
    it("should grab a subtree by id selector + partial props", function() {
      var wut = tree.subTree("#wut", { id: 'wut', prop: "foo" });
      expect(wut).to.eql(false);

      var wut2 = tree.subTree("#wut", { prop: "val" });
      expect(wut2).to.be.an('object');
      expect(wut2.getRenderOutput().props).to.have.property("id", "wut");
    });
    it("should grab a subtree by class selector", function() {
      var abc = tree.subTree(".abc");
      expect(abc).to.be.an('object');
      expect(abc.getRenderOutput().props).to.have.property("className", "abc");
    });
    it("should grab a subtree by class selector + partial props", function() {
      var yup = tree.subTree(".yup", { className: 'yup', prop: "foo" });
      expect(yup).to.eql(false);

      var yup2 = tree.subTree(".yup", { prop: "val" });
      expect(yup2).to.be.an('object');
      expect(yup2.getRenderOutput().props).to.have.property("className", "yup");
    });
    it("should grab a subtree by tag selector", function() {
      var abc = tree.subTree("object");
      expect(abc).to.be.an('object');
      expect(abc.getRenderOutput().props)
        .to.have.property("children", "objection!");
    });
    it("should grab a subtree by tag selector + partial props", function() {
      var subtree = tree.subTree("object", { children: 'not objection!' });
      expect(subtree).to.eql(false);

      var subtree2 = tree.subTree("object", { children: 'objection!' });
      expect(subtree2).to.be.an('object');
      expect(subtree2.getRenderOutput().props).to.have.property('id', 'bob');
    });
    it("should grab a subtree by component name", function() {
      var abc = tree.subTree("Widget");
      expect(abc).to.be.an('object');
      expect(abc.getRenderOutput().props)
        .to.have.property("children", "stuff");
    });
    it("should grab a subtree by component + partial props", function() {
      var subtree = tree.subTree("Widget", { children: 'not stuff' });
      expect(subtree).to.eql(false);

      var subtree2 = tree.subTree("Widget", { more: true });
      expect(subtree2).to.be.an('object');
      expect(subtree2.getRenderOutput().props).to.have.property('test', 'abc');
    });
    it("should grab first subtree by * selector + partial props", function() {
      var subtree = tree.subTree("*", { prop: 'val' });
      expect(subtree).to.be.an('object');
      expect(subtree.getRenderOutput().props).to.have.property('id', 'bob');
    });
    describe("methods", function() {
      var subTree;
      beforeEach(function() {
        subTree = tree.subTree('#abc');
      });
      it("should have same methods as main tree", function() {
        expect(Object.keys(tree)).to.eql(Object.keys(subTree));
      });
      it("should provide scoped subTree()", function() {
        expect(subTree.subTree(".abc").text()).to.eql("ABC");
      });
      it("should provide scoped text()", function() {
        expect(subTree.text()).to.eql("objection!objection!helloABC");
      });
      it("should expose .props", function() {
        expect(tree.subTree('#wut').props).to.eql({
          id: 'wut', prop: 'val'
        });
      });
    });
  });

  describe("everySubTree", function() {
    var tree, trees;
    before(function() {
      tree = sd.shallowRender(
        $('ul', {},
          $('li', { className: "abc" }, $('span', {}, 1)),
          $('li', { className: "abc" }, $('span', {}, 2)),
          $('li', { className: "abc" }, $('span', {}, 3)),
          $('li', { className: "abc" }, $('span', {}, 4)),
          $('li', { className: "first-class abc more-class" }, $('span', {}, 5))
        )
      );
    });
    describe("using class selector", function() {
      beforeEach(function() {
        trees = tree.everySubTree(".abc");
      });
      it("should return array", function() {
        expect(trees).to.be.an('array');
        expect(trees).to.have.length(5);
      });
      it("should have SkinDeep subtrees in array", function() {
        trees.forEach(function(subTree) {
          expect(subTree).to.be.an('object');
          expect(Object.keys(subTree)).to.eql(Object.keys(tree));
        });
      });
      it("should be able to extract text from each", function() {
        var texts = trees.map(function(st) { return st.text(); });
        expect(texts).to.eql(["1", "2", "3", "4", "5"]);
      });
    });
    describe("using tag selector", function() {
      beforeEach(function() {
        trees = tree.everySubTree("li");
      });
      it("should return array", function() {
        expect(trees).to.be.an('array');
        expect(trees).to.have.length(5);
      });
      it("should have SkinDeep subtrees in array", function() {
        trees.forEach(function(subTree) {
          expect(subTree).to.be.an('object');
          expect(Object.keys(subTree)).to.eql(Object.keys(tree));
        });
      });
      it("should be able to extract text from each", function() {
        var texts = trees.map(function(st) { return st.text(); });
        expect(texts).to.eql(["1", "2", "3", "4", "5"]);
      });
    });
    describe("using tag selector with props", function() {
      beforeEach(function() {
        trees = tree.everySubTree("span", { children: 1 });
      });
      it("should return array", function() {
        expect(trees).to.be.an('array');
        expect(trees).to.have.length(1);
      });
      it("should have SkinDeep subtrees in array", function() {
        trees.forEach(function(subTree) {
          expect(subTree).to.be.an('object');
          expect(Object.keys(subTree)).to.eql(Object.keys(tree));
        });
      });
    });
    describe("using * selector with props", function() {
      beforeEach(function() {
        trees = tree.everySubTree("*", { children: 1 });
      });
      it("should return array", function() {
        expect(trees).to.be.an('array');
        expect(trees).to.have.length(1);
      });
      it("should have SkinDeep subtrees in array", function() {
        trees.forEach(function(subTree) {
          expect(subTree).to.be.an('object');
          expect(Object.keys(subTree)).to.eql(Object.keys(tree));
        });
      });
    });
    describe("nested matches", function() {
      before(function() {
        tree = sd.shallowRender(
          $('div', {},
            $('div', {},
              $('div', {},
                $('div', {}, "deep")))
          )
        );
        trees = tree.everySubTree("div");
      });
      it("should find nodes deeply", function() {
        expect(trees).to.be.an('array');
        expect(trees).to.have.length(4);
      });
      it("should have SkinDeep subtrees in array", function() {
        trees.forEach(function(subTree) {
          expect(subTree).to.be.an('object');
          expect(Object.keys(subTree)).to.eql(Object.keys(tree));
        });
      });
      it("should be able to extract text from each", function() {
        var texts = trees.map(function(st) { return st.text(); });
        expect(texts).to.eql(['deep', 'deep', 'deep', 'deep']);
      });
    });
  });

  describe("everySubTree", function() {
    var tree, trees, classTrees, tagTrees;
    before(function() {
      tree = sd.shallowRender(
        $('ul', {},
          $('li', { className: "abc", idx: 1, more: 'li1' },
            $('span', { prop: 'val', idx: 1, more: '1' }, 1)),
          $('li', { className: "abc", idx: 2, more: 'li2' },
            $('span', { prop: 'val', idx: 2, more: '2' }, 2)),
          $('li', { className: "abc" }, 3),
          $('li', { className: "abc" },
            $('span', { prop: 'val', idx: 4, more: '4' }, 4)),
          $('li', { className: "abc" }, 5)
        )
      );
    });
    describe("functionaly == everySubTree when used without props", function() {
      beforeEach(function() {
        classTrees = tree.everySubTree(".abc");
        tagTrees = tree.everySubTree("span");
      });
      it("should return array", function() {
        expect(classTrees).to.be.an('array');
        expect(classTrees).to.have.length(5);
        expect(tagTrees).to.be.an('array');
        expect(tagTrees).to.have.length(3);
      });
      it("should have SkinDeep subtrees in array", function() {
        classTrees.forEach(function(subTree) {
          expect(subTree).to.be.an('object');
          expect(Object.keys(subTree)).to.eql(Object.keys(tree));
        });
        tagTrees.forEach(function(subTree) {
          expect(subTree).to.be.an('object');
          expect(Object.keys(subTree)).to.eql(Object.keys(tree));
        });
      });
      it("should be able to extract text from each", function() {
        var classTText = classTrees.map(function(st) { return st.text(); });
        expect(classTText).to.eql(["1", "2", "3", "4", "5"]);
        var tagTTrees = tagTrees.map(function(st) { return st.text(); });
        expect(tagTTrees).to.eql(["1", "2", "4"]);
      });
    });
    describe("using class selector + partial props", function() {
      beforeEach(function() {
        trees = tree.everySubTree(".abc", { idx: 2 });
      });
      it("should return array", function() {
        expect(trees).to.be.an('array');
        expect(trees).to.have.length(1);
        expect(trees[0].props).to.have.property('more', 'li2');
      });
      it("should have SkinDeep subtrees in array", function() {
        trees.forEach(function(subTree) {
          expect(subTree).to.be.an('object');
          expect(Object.keys(subTree)).to.eql(Object.keys(tree));
        });
      });
    });
    describe("using tag selector + partial props", function() {
      beforeEach(function() {
        trees = tree.everySubTree("span", { prop: 'val' });
      });
      it("should return array", function() {
        expect(trees).to.be.an('array');
        expect(trees).to.have.length(3);
      });
      it("should have SkinDeep subtrees in array", function() {
        trees.forEach(function(subTree) {
          expect(subTree).to.be.an('object');
          expect(Object.keys(subTree)).to.eql(Object.keys(tree));
        });
      });
      it("should return subtree's in order", function() {
        expect(trees[0].getRenderOutput().props).to.have.property('idx', 1);
        expect(trees[1].getRenderOutput().props).to.have.property('idx', 2);
        expect(trees[2].getRenderOutput().props).to.have.property('idx', 4);
      });
    });
    describe("using * selector + partial props", function() {
      beforeEach(function() {
        trees = tree.everySubTree("*", { idx: 4, prop: 'val' });
      });
      it("should return array", function() {
        expect(trees).to.be.an('array');
        expect(trees).to.have.length(1);
        expect(trees[0].getRenderOutput().props).to.have.property('more', '4');
      });
      it("should have SkinDeep subtrees in array", function() {
        trees.forEach(function(subTree) {
          expect(subTree).to.be.an('object');
          expect(Object.keys(subTree)).to.eql(Object.keys(tree));
        });
      });
    });
    describe("nested matches + partial props", function() {
      before(function() {
        tree = sd.shallowRender(
          $('div', { idx: '1', prop: 'val', more: false },
            $('div', { idx: '2', prop: 'val', more: true }, "deep ",
              $('div', { idx: '3', prop: 'val', more: false },
                $('div', { idx: '4', prop: 'val', more: true }, "deep")))
          )
        );
        trees = tree.everySubTree("div", { prop: 'val', more: true });
      });
      it("should find nodes deeply", function() {
        expect(trees).to.be.an('array');
        expect(trees).to.have.length(2);
      });
      it("should have SkinDeep subtrees in array", function() {
        trees.forEach(function(subTree) {
          expect(subTree).to.be.an('object');
          expect(Object.keys(subTree)).to.eql(Object.keys(tree));
        });
      });
      it("should be able to extract text from each", function() {
        var texts = trees.map(function(st) { return st.text(); });
        expect(texts).to.eql(['deep deep', 'deep']);
      });
      it("should return subtree's in order", function() {
        expect(trees[0].getRenderOutput().props).to.have.property('idx', '2');
        expect(trees[1].getRenderOutput().props).to.have.property('idx', '4');
      });
    });
  });

  describe.skip("findComponent", function() {
    var Widget = createClass({
      displayName: 'Widget',
      render: function() { return null; }
    });
    var tree = sd.shallowRender(
      $('div', {},
        $('span', {}, "stuff", "and", "nonsense"),
        $('b', { className: "go" }, "away"),
        $(Widget, {}),
        $(Widget, { some: "value", num: 123 }),
        $(Widget, {}, "kids")
      )
    );
    it("should find a DOM component", function() {
      var c = tree.findComponent('span', {
        children: ["stuff", "and", "nonsense"]
      });
      expect(c).to.have.property('type', 'span');
      expect(c.props.children).to.eql(["stuff", "and", "nonsense"]);
    });
    it("should find a DOM component with props", function() {
      var c = tree.findComponent('b', { className: "go", children: "away" });
      expect(c).to.have.property('type', 'b');
      expect(c.props).to.eql({ className: "go", children: "away" });
    });
    it("should find a component", function() {
      var c = tree.findComponent('Widget', {});
      expect(c).to.have.property('type', Widget);
      expect(c.props).to.eql({});
    });
    it("should find a component with props", function() {
      var c = tree.findComponent('Widget', { some: "value", num: 123 });
      expect(c).to.have.property('type', Widget);
      expect(c.props).to.eql({ some: "value", num: 123 });
    });
    it("should find a component with children", function() {
      var c = tree.findComponent('Widget', { children: "kids" });
      expect(c).to.have.property('type', Widget);
      expect(c.props).to.eql({ children: "kids" });
    });
    it("should fail to find a DOM component", function() {
      expect(tree.findComponent('span', { children: ["real", "stuff"] }))
        .to.eql(false);
    });
    it("should fail to find a component", function() {
      expect(tree.findComponent('Widget', { "other": "value" }))
        .to.eql(false);
    });
    it("should fail to find a component with children", function() {
      expect(tree.findComponent('Widget', { children: "adults" }))
        .to.eql(false);
    });
    describe("back-compat with a warning", function() {
      /* eslint-disable no-console */
      var originalWarn = console.warn;
      var warning;
      beforeEach(function() {
        warning = null;
        console.warn = function(msg) {
          warning = msg;
        };
      });
      afterEach(function() {
        console.warn = originalWarn;
      });
      /* eslint-enable no-console */
      it("should find a DOM component", function() {
        var c = tree.findComponent($('span', {}, "stuff", "and", "nonsense"));
        expect(c).to.have.property('type', 'span');
        expect(c.props.children).to.eql(["stuff", "and", "nonsense"]);
        expect(warning).to.match(/deprecated/);
      });
      it("should find a DOM component with props", function() {
        var c = tree.findComponent($('b', { className: "go" }, "away"));
        expect(c).to.have.property('type', 'b');
        expect(c.props).to.eql({ className: "go", children: "away" });
        expect(warning).to.match(/deprecated/);
      });
      it("should find a component", function() {
        var c = tree.findComponent($(Widget, {}));
        expect(c).to.have.property('type', Widget);
        expect(c.props).to.eql({});
        expect(warning).to.match(/deprecated/);
      });
      it("should find a component with props", function() {
        var c = tree.findComponent($(Widget, { some: "value", num: 123 }));
        expect(c).to.have.property('type', Widget);
        expect(c.props).to.eql({ some: "value", num: 123 });
        expect(warning).to.match(/deprecated/);
      });
    });
  });

  describe.skip("findComponentLike", function() {
    var Widget = createClass({
      displayName: 'Widget',
      render: function() { return null; }
    });
    var tree = sd.shallowRender(
      $('div', {},
        $('span', {}, "stuff", "&", "nonsense"),
        $('b', { className: "go" }, "away"),
        $(Widget, {}),
        $(Widget, { some: "value", num: 123 }),
        $(Widget, {}, "kids")
      )
    );
    it("should find a DOM component", function() {
      var c = tree.findComponentLike('span',
        { children: ["stuff", "&", "nonsense"] }
      );
      expect(c).to.have.property('type', 'span');
      expect(c.props).to.eql({ children: ["stuff", "&", "nonsense"] });
    });
    it("should find a DOM component via partial match", function() {
      var c = tree.findComponentLike('b', { className: "go" });
      expect(c).to.have.property('type', 'b');
      expect(c.props).to.have.eql({ className: "go", children: "away" });
    });
    it("should find a component", function() {
      var c = tree.findComponentLike('Widget', {});
      expect(c).to.have.property('type', Widget);
      expect(c.props).to.eql({});
    });
    it("should find a component with partial props", function() {
      var c = tree.findComponentLike('Widget', { num: 123 });
      expect(c).to.have.property('type', Widget);
      expect(c.props).to.eql({ some: "value", num: 123 });
    });
    it("should fail to find a DOM component", function() {
      expect(tree.findComponentLike('span', { children: ["real", "stuff"] }))
        .to.eql(false);
    });
    it("should fail to find a DOM component if doesn't match", function() {
      expect(tree.findComponentLike('b', { className: "go", id: "away" }))
        .to.eql(false);
    });
    it("should fail to find a component if doesn't match", function() {
      expect(tree.findComponentLike('Widget', { abc: 123 }))
        .to.eql(false);
    });
    it("should fail to find a component if doesn't match", function() {
      expect(tree.findComponentLike('Widget', { num: 123, x: "y" }))
        .to.eql(false);
    });
    describe("back-compat with a warning", function() {
      /* eslint-disable no-console */
      var originalWarn = console.warn;
      var warning;
      beforeEach(function() {
        warning = null;
        console.warn = function(msg) {
          warning = msg;
        };
      });
      afterEach(function() {
        console.warn = originalWarn;
      });
      /* eslint-enable no-console */
      it("should find a DOM component", function() {
        var c = tree.findComponentLike($('span', {}, "stuff", "&", "nonsense"));
        expect(c).to.have.property('type', 'span');
        expect(c.props).to.eql({ children: ["stuff", "&", "nonsense"] });
        expect(warning).to.match(/deprecated/);
      });
      it("should find a DOM component via partial match", function() {
        var c = tree.findComponentLike($('b', { className: "go" }));
        expect(c).to.have.property('type', 'b');
        expect(c.props).to.have.eql({ className: "go", children: "away" });
        expect(warning).to.match(/deprecated/);
      });
      it("should find a component", function() {
        var c = tree.findComponentLike($(Widget, {}));
        expect(c).to.have.property('type', Widget);
        expect(c.props).to.eql({});
        expect(warning).to.match(/deprecated/);
      });
      it("should find a component with partial props", function() {
        var c = tree.findComponentLike($(Widget, { num: 123 }));
        expect(c).to.have.property('type', Widget);
        expect(c.props).to.eql({ some: "value", num: 123 });
        expect(warning).to.match(/deprecated/);
      });
    });
  });

  describe("React.Children & Fragments", function() {
    var WithKids = createClass({
      displayName: 'WithKids',
      render: function() {
        return $('ul', {},
          React.Children.map(
            this.props.children,
            function(x) { return x; }
          )
        );
      }
    });
    var tree1 = sd.shallowRender(
      $(WithKids, {},
        $('li', { id: 'a' }, 'a '),
        null,
        false,
        undefined,
        $('li', { id: 'b' }, 'b')
      )
    );
    var tree2 = sd.shallowRender(
      $('div', {},
        createFragment({
          left: $('span', { id: 'left' }, 'left '),
          right: $('span', { id: 'right' }, 'right')
        })
      )
    );
    describe.skip('findNode', function() {
      it('should work within Children', function() {
        expect(tree1.findNode('#a')).to.not.eql(false);
        expect(tree1.findNode('#b')).to.not.eql(false);
      });
      it('should work within fragments', function() {
        expect(tree2.findNode('#left')).to.not.eql(false);
        expect(tree2.findNode('#right')).to.not.eql(false);
      });
    });
    describe('text', function() {
      it('should work within Children', function() {
        expect(tree1.text()).to.contain('a b');
      });
      it('should work within fragments', function() {
        expect(tree2.text()).to.contain("left right");
      });
    });
    describe('everySubTree', function() {
      it('should work within Children', function() {
        expect(tree1.everySubTree('li')).to.have.length(2);
      });
      it('should work within fragments', function() {
        expect(tree2.everySubTree('span')).to.have.length(2);
      });
    });
  });
  describe('dive', function() {
    var Baby = createClass({
      displayName: 'Baby',
      render: function() {
        return $('div', { id: this.props.goats });
      }
    });
    var Mum = createClass({
      displayName: 'Mum',
      contextTypes: { name: PropTypes.string.isRequired },
      render: function() {
        return $('div', { contextName: this.context.name },
          $(Baby, { goats: this.props.sheep }),
          $(Baby, { goats: 'bye' })
        );
      }
    });
    var Granny = createClass({
      displayName: 'Granny',
      render: function() {
        return $(Mum, { sheep: this.props.onions }, $('h1', {}));
      }
    });
    var GreatGranny = createClass({
      displayName: 'GreatGranny',
      render: function() {
        return $(Granny, { onions: this.props.cheese });
      }
    });

    var greatTree = sd.shallowRender($(GreatGranny, { cheese: 'hello' }));

    it('should create instance of first component in path', function() {
      var result = greatTree.dive(['Granny', 'Mum', 'Baby'], { name: 'Jane' });
      var babyTrees = [
        sd.shallowRender($(Baby, { goats: 'hello' })),
        sd.shallowRender($(Baby, { goats: 'bye' }))
      ];
      expect(result.getRenderOutput()).to.eql(
        babyTrees[0].getRenderOutput()
      );
    });
    it('should pass through the props', function() {
      var result = greatTree.dive(['Granny', 'Mum', 'Baby'], { name: 'Jane' });
      expect(result.props.id).to.eql('hello');
    });
    it('should pass through the context', function() {
      var result = greatTree.dive(['Granny', 'Mum'], { name: 'Jane' });
      expect(result.getRenderOutput().props.contextName).to.eql('Jane');
    });
    it('should work with children that are html elements', function() {
      var other = greatTree.dive(['Granny', 'h1']);
      expect(other.type).to.eql('h1');
      expect(other.props).to.eql({});
    });
    it('should only traverse the given path', function() {
      var result = greatTree.dive(['Granny', 'Mum'], { name: 'Jane' });
      var other = greatTree.dive(['Granny', 'h1']);
      expect(result.getRenderOutput()).to.not.eql(other.getRenderOutput());
    });
    it('should throw if element not found', function() {
      expect(function() {
        return greatTree.dive(['Granny', 'Mum', 'h4'], { name: 'Jane' });
      }).to.throw('h4 not found in tree');
    });
    it('should not alter the input path variable', function() {
      var path = ['Granny', 'Mum'];
      var result = greatTree.dive(path, { name: 'Jane' });
      expect(result.getRenderOutput().props.contextName).to.eql('Jane');

      var result2 = greatTree.dive(path, { name: 'Jane' });
      expect(result2.getRenderOutput().props.contextName).to.eql('Jane');
    });
  });
});
