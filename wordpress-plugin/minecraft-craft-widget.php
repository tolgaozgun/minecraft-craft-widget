<?php
/**
 * Plugin Name: Minecraft Craft Widget
 * Plugin URI: https://github.com/tolgaozgun/minecraft-craft-widget
 * Description: Embeddable Minecraft crafting recipe widget with full recipe database
 * Version: 1.0.0
 * Author: Minecraft Craft Widget
 * License: MIT
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('MCW_PLUGIN_URL', plugin_dir_url(__FILE__));
define('MCW_PLUGIN_PATH', plugin_dir_path(__FILE__));

// Allow JS uploads for administrators
function mcw_allow_js_uploads($mimes) {
    if (current_user_can('administrator')) {
        $mimes['js'] = 'application/javascript';
    }
    return $mimes;
}
add_filter('upload_mimes', 'mcw_allow_js_uploads');

// Enqueue widget script
function mcw_enqueue_scripts() {
    // Only load on pages that use the shortcode
    global $post;
    if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'minecraft_widget')) {
        wp_enqueue_script(
            'minecraft-craft-widget',
            MCW_PLUGIN_URL . 'minecraft-craft-widget.min.js',
            array(),
            '1.0.0',
            true
        );
        
        // Pass WordPress URL to script for icon loading
        wp_localize_script('minecraft-craft-widget', 'mcw_config', array(
            'iconBaseUrl' => MCW_PLUGIN_URL . 'icons/'
        ));
    }
}
add_action('wp_enqueue_scripts', 'mcw_enqueue_scripts');

// Shortcode for embedding the widget
function mcw_shortcode($atts) {
    $atts = shortcode_atts(array(
        'id' => 'mc-craft',
        'height' => '600px'
    ), $atts);
    
    return sprintf(
        '<div id="%s" style="min-height: %s;"></div>',
        esc_attr($atts['id']),
        esc_attr($atts['height'])
    );
}
add_shortcode('minecraft_widget', 'mcw_shortcode');

// Add admin menu for widget management
function mcw_admin_menu() {
    add_menu_page(
        'Minecraft Widget',
        'Minecraft Widget',
        'manage_options',
        'minecraft-widget',
        'mcw_admin_page',
        'dashicons-games',
        30
    );
}
add_action('admin_menu', 'mcw_admin_menu');

// Admin page content
function mcw_admin_page() {
    ?>
    <div class="wrap">
        <h1>Minecraft Craft Widget</h1>
        
        <div class="card">
            <h2>How to Use</h2>
            <p>Add the Minecraft crafting widget to any page or post using the shortcode:</p>
            <code>[minecraft_widget]</code>
            
            <h3>Optional Parameters:</h3>
            <ul>
                <li><code>id</code> - Custom container ID (default: mc-craft)</li>
                <li><code>height</code> - Minimum height (default: 600px)</li>
            </ul>
            
            <h3>Example:</h3>
            <code>[minecraft_widget id="my-widget" height="800px"]</code>
        </div>
        
        <div class="card">
            <h2>Direct HTML Embed</h2>
            <p>You can also embed directly in HTML:</p>
            <pre>&lt;div id="mc-craft"&gt;&lt;/div&gt;
&lt;script src="<?php echo MCW_PLUGIN_URL; ?>minecraft-craft-widget.min.js"&gt;&lt;/script&gt;</pre>
        </div>
        
        <div class="card">
            <h2>Widget Status</h2>
            <?php
            $widget_file = MCW_PLUGIN_PATH . 'minecraft-craft-widget.min.js';
            $icons_dir = MCW_PLUGIN_PATH . 'icons';
            
            if (file_exists($widget_file)) {
                $size = filesize($widget_file);
                echo '<p>✓ Widget file installed (' . round($size / 1024) . ' KB)</p>';
            } else {
                echo '<p>✗ Widget file not found</p>';
            }
            
            if (is_dir($icons_dir)) {
                $icon_count = count(glob($icons_dir . '/minecraft/*.png'));
                echo '<p>✓ ' . $icon_count . ' icons installed</p>';
            } else {
                echo '<p>✗ Icons directory not found</p>';
            }
            ?>
        </div>
    </div>
    <?php
}

// Activation hook
register_activation_hook(__FILE__, 'mcw_activate');
function mcw_activate() {
    // Create directories if they don't exist
    $dirs = array(
        MCW_PLUGIN_PATH . 'icons',
        MCW_PLUGIN_PATH . 'icons/minecraft'
    );
    
    foreach ($dirs as $dir) {
        if (!is_dir($dir)) {
            wp_mkdir_p($dir);
        }
    }
}
?>