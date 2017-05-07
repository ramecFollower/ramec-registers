 (function() {
    YAHOO.Bubbling.fire("registerAction",
    {
        actionName: "onActionRamecRefreshPage",
        fn: function ramec_RefreshPage() {
            window.location.reload();
        }
    });
})();