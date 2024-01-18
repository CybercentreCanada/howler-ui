# Vues

Les vues sont une fonctionnalité de Howler qui permet aux utilisateurs de créer des requêtes personnalisées par défaut à travers lesquelles ils peuvent organiser et trier les hits. Dans ce document, nous décrirons comment créer, mettre à jour, interagir avec et supprimer des vues.

## Utilisation d'une vue

Vous pouvez utiliser les vues de plusieurs façons. La plus simple consiste à utiliser la barre de recherche et à appuyer sur l'icône "plus", ce qui vous permet de sélectionner des vues existantes et de les ajouter :

`search_select`

Le fait de sélectionner plusieurs requêtes vous permet de choisir entre "`AND`/`OR` les vues :

`search_select_multiple`

Vous pouvez également charger les vues actives dans le champ de saisie à l'aide de l'icône `load`, ou effacer les vues sélectionnées à l'aide de l'icône `clear`.

### Gestionnaire de vues

Vous pouvez également accéder au [Gestionnaire de vues] (/views). À partir de là, vous pouvez utiliser l'icône "recherche" pour ouvrir la vue dans la page de recherche. Vous pouvez également éditer les vues qui vous appartiennent et les marquer comme favorites. Cela les affichera dans le menu déroulant `t(route.views.saved)` dans la barre latérale. En haut à droite, vous pouvez également choisir votre "`t(route.views.manager.default)`", qui sera sélectionné par défaut lors de l'ouverture de la page d'alertes.

## Création de vues

Pour créer une vue, la première étape consiste à utiliser l'invite de recherche pour saisir une requête que vous souhaitez enregistrer.

`search_query`

Pour sauvegarder la requête, appuyez sur l'icône "cœur" et saisissez un nom pour la vue :

`search_saving`

Il y a plusieurs drapeaux supplémentaires que vous pouvez définir :

### `t(global)`

Cela permet d'exposer la vue à tous les utilisateurs, au lieu de la garder privée pour votre seul usage.

### `t(tui.query.save.append)`

La nouvelle vue héritera de toutes les vues supplémentaires que vous avez sélectionnées lors de la création. Par exemple, sauvegarder avec cet ensemble de vues :

`searching_saving_with_active_views`

aboutira à cette requête :

`query_result`


