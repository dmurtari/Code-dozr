json.array!(@editors) do |editor|
  json.extract! editor, :id, :name
  json.url editor_url(editor, format: :json)
end
