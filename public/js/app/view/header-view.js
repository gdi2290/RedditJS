define(['App', 'jquery', 'underscore', 'backbone', 'hbs!template/header', 'view/userbar-view', 'view/basem-view', 'model/sidebar', 'cookie'],
	function(App, $, _, Backbone, HeaderTmpl, UserbarView, BaseView, SidebarModel, Cookie) {
		return BaseView.extend({
			template: HeaderTmpl,
			events: {
				'click .tabmenu-right li': 'changeGridOption',
				'click .drop-down-header-toggle': 'toggleDropdown',
				'click #header-nav-logo-area': 'toggleDropdown', //will close the menu after the user makes a selection
				'click #userbar-logged-out': 'showLoginPopup'
			},

			ui: {
				'siteTable': '#siteTable',
				'nextprev': '.nextprev',
				'headerImg': '#header-img',
				'pagenameA': '#pagename-a',
				'hot': '.hot',
				'New': '.new',
				'rising': '.rising',
				'controversial': '.controversial',
				'top': '.top',
				'normal': '#normal',
				'small': '#small',
				'large': '#large',
				'grid': '#grid',
				'headerNavLogoArea': '#header-nav-logo-area',
				'srBar': '#sr-bar'

			},
			regions: {
				'btmRightHeader': '#header-bottom-right',
				'popupWindow': '#popupWindow'
			},
			initialize: function(data) {
				_.bindAll(this);
				console.log("I should only render the header once")

				App.on("header:update", this.updateHeader, this);
				App.on("login", this.updateSubreddits, this); //so we update the users subreddits after they login
				App.on("header:updateSortOrder", this.updateSortOrder, this);
				App.on("header:refreshSubreddits", this.refreshSubreddits, this);

				App.on('header:showLoginBox', this.showLoginPopup, this)

				//load the subreddits on the top bar
				//we want to always display the default subreddits at first because they take a long time to get back from the api

				this.listenTo(window.subreddits, 'sync', this.displayMySubreddits)

			},
			onRender: function() {

				this.changeActiveGrid($.cookie('gridOption')) //so we are highlighting the correct grid option on page load

				this.btmRightHeader.show(new UserbarView())
				this.displayMySubreddits()

			},

			showLoginPopup: function(e) {
				var self = this
				if (e) {
					e.preventDefault()
					e.stopPropagation();
				}
				require(['view/login-popup-view'], function(LoginPopupView) {
					self.popupWindow.show(new LoginPopupView())
				});
			},

			updateHeader: function(model) {
				this.model = model
				//this.userbar.render()
				this.ui.pagenameA.prop("href", model.get('rname'))
				this.ui.pagenameA.text(model.get('display_name'))
				var header_img = model.get('header_img')
				if (typeof header_img === 'undefined' || header_img === null) {
					this.ui.headerImg.attr("src", '/img/logo.png');
				} else {
					this.ui.headerImg.attr("src", header_img);
				}
				this.ui.hot.prop("href", model.get('rname'))
				this.ui.New.prop("href", model.get('rname') + "/new")
				this.ui.rising.prop("href", model.get('rname') + "/rising")
				this.ui.controversial.prop("href", model.get('rname') + "/controversial")
				this.ui.top.prop("href", model.get('rname') + "/top")

			},
			updateSortOrder: function(data) {
				//console.log(data)
				var sortOrder = data.sortOrder
				var domain = data.domain
				var subName = data.subName
				this.ui.hot.parent().removeClass('selected');
				this.ui.New.parent().removeClass('selected');
				this.ui.rising.parent().removeClass('selected');
				this.ui.controversial.parent().removeClass('selected');
				this.ui.top.parent().removeClass('selected');
				this.$('.' + sortOrder).parent().addClass('selected');

				if (domain === null) {
					//http://localhost/r/funny/new
					this.ui.hot.attr("href", "/r/" + subName + '/');
					this.ui.New.attr("href", "/r/" + subName + '/new');
					this.ui.rising.attr("href", "/r/" + subName + '/rising');
					this.ui.controversial.attr("href", "/r/" + subName + '/controversial');
					this.ui.top.attr("href", "/r/" + subName + '/top');
				} else {
					//http://localhost/domain/i.imgur.com/new
					this.ui.hot.attr("href", "/domain/" + domain + '/');
					this.ui.New.attr("href", "/domain/" + domain + '/new');
					this.ui.rising.attr("href", "/domain/" + domain + '/rising');
					this.ui.controversial.attr("href", "/domain/" + domain + '/controversial');
					this.ui.top.attr("href", "/domain/" + domain + '/top');
				}
			},

			changeGridOption: function(e) {
				e.preventDefault()
				e.stopPropagation();
				var id = this.$(e.currentTarget).attr('id')
				App.trigger("subreddit:changeGridOption", {
					gridOption: id
				});
				this.changeActiveGrid(id) //so we are highlighting the correct grid option on page load
				$.cookie('gridOption', id, {
					path: '/'
				});
			},
			changeActiveGrid: function(id) {
				if (typeof id === 'undefined' || id === null || id === "") {
					id = 'normal'
				}

				this.ui.normal.removeClass('selected');
				this.ui.small.removeClass('selected');
				this.ui.large.removeClass('selected');
				this.ui.grid.removeClass('selected');
				this.$('#' + id).addClass('selected');
			},
			refreshSubreddits: function() {
				$.removeCookie('subreddits', {
					path: '/'
				});
				this.updateSubreddits()
			},
			updateSubreddits: function() {
				window.subreddits.reset()
				//query the api for /me.json
				window.subreddits.fetch();

			},

			toggleDropdown: function() {
				var self = this
				if (this.ui.headerNavLogoArea.is(':visible')) {
					this.ui.headerNavLogoArea.slideUp("slow")
				} else {
					this.ui.headerNavLogoArea.empty()
					window.subreddits.each(function(model) {

						var headerImg = model.get('header_img')
						var displayName = model.get('display_name')
						if (headerImg === null) {
							self.ui.headerNavLogoArea.append("<span class='headerNavLogo' ><a class='text-header-nav'  href='/r/" + displayName + "' >" + displayName + "</span></a> ")
						} else {
							self.ui.headerNavLogoArea.append("<span class='headerNavLogo'><a href='/r/" + displayName + "' title='" + displayName + "' ><img src='" + headerImg + "' /></a></span>")
						}

					})

					this.ui.headerNavLogoArea.slideDown("slow")
				}

			},

			displayMySubreddits: function(response, subreddits) {
				var self = this;
				this.ui.srBar.html(" ") //clear the top
				this.ui.headerNavLogoArea.empty()

				//    Normal Format: 
				//			<li><a href="/r/pics/">pics</a></li>
				//   Every Subreddit after the first one has a seperator:  
				//			<li><span class="separator">-</span><a href= "/r/funny/">funny</a></li>
				//if (this.checkIfLoggedIn() === false) {
				//window.subreddits.loadDefaultSubreddits()
				//}
				//window.subreddits = this.mySubreddits
				var seperator = '';
				var count = 0;
				window.subreddits.each(function(model) {

					if (count !== 0) {
						seperator = '<span class="separator">-</span>';
					}

					if (model.get('display_name') != "announcements" && model.get('display_name') != "blog") {

						self.ui.srBar.append('<li>' + seperator + '<a href="/r/' + model.get('display_name') + '/">' + model.get('display_name') + '</a></li>')

						count++;
					}
				})

				//this.displayDropChoices()
				App.trigger("submit:subreddits");
			}

		});
	});