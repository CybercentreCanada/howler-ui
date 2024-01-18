# Views

Views are a feature in Howler that allows users to create custom, default queries through which they can organize and triage hits. In this document, we will outline how to create, update, interact with and delete views.

## Using a View

You can use views in several ways. The simplest is using the search bar, and press the `plus` icon, which will allow you to select from existing views and add them:

`search_select`

Having multiple queries selected allows you to choose between `AND`ing/`OR`ing the views:

`search_select_multiple`

You can also load the active views into the input field using the `load` icon, or clear the selected views using the `clear` icon.

### View Manager

You can also navigate to the [View Manager](/views). From here, you can use the `search` icon to open the view in the search page. You can also edit views that belong to you, and mark them as favourites. This will show them in the `t(route.views.saved)` dropdown in the sidebar. In the top right, you can also choose your "`t(route.views.manager.default)`", that will be selected by default when opening the alerts page.

## Creating Views

In order to create a view, the first step is to use the search prompt to input a query that you want to save.

`search_query`

In order to save the query, press the `heart` icon and input a name for the view:

`search_saving`

There are several additional flags you can set:

### `t(global)`

This will expose the view to all users, instead of keeping it private for your use only.

### `t(tui.query.save.append)`

This will cause the new view to inherit any additional views you have selected on creation. For example, saving with this set of views:

`searching_saving_with_active_views`

will result in this query:

`query_result`


