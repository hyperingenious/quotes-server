const {link_count, links_array} = require('../image_links')

function get_a_image_link() {
const val = Math.trunc(Math.random()*link_count)
console.log("This Image url has been chosen",links_array[val],val)
return links_array[val];
}
module.exports = {get_a_image_link}
