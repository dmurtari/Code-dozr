module.exports = function(app) {
  app.get('/editor', function(req, res) {
    res.render('editor.jade', {})
  })
}