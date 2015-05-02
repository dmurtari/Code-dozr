$(document).ready(function () {
  var socket = new BCSocket(null, { reconnect: true });
  var sharejsSocket = new window.sharejs.Connection(socket);
  var doc = sharejsSocket.get("textareas", "textarea1");
  doc.subscribe();
  doc.whenReady(function () {
if (!doc.type) {
  doc.create("text");
}
doc.attachTextarea(document.getElementById("editor"));
  });
});