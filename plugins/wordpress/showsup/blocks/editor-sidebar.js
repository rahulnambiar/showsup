/**
 * ShowsUp Gutenberg Editor Sidebar
 *
 * Adds an "AI Visibility" panel to the WordPress block editor sidebar
 * that shows the current scan score and llms.txt / schema status,
 * and lets users trigger a scan or regenerate llms.txt without leaving the editor.
 */
( function () {
	'use strict';

	var el         = wp.element.createElement;
	var __ = wp.i18n.__;
	var registerPlugin    = wp.plugins.registerPlugin;
	var PluginSidebar     = wp.editPost.PluginSidebar;
	var PluginSidebarMoreMenuItem = wp.editPost.PluginSidebarMoreMenuItem;
	var Panel    = wp.components.Panel;
	var PanelBody = wp.components.PanelBody;
	var PanelRow  = wp.components.PanelRow;
	var Button    = wp.components.Button;
	var Spinner   = wp.components.Spinner;
	var Notice    = wp.components.Notice;

	var SIDEBAR_NAME = 'showsup/sidebar';

	// ── Component ──────────────────────────────────────────────────────────────

	function ShowsUpSidebar() {
		var _useState = wp.element.useState;
		var _useEffect = wp.element.useEffect;

		var state = _useState( {
			loading:   false,
			scanning:  false,
			deploying: false,
			score:     null,
			lastScan:  '',
			deployed:  false,
			deployedAt: '',
			notice:    null,
			error:     null,
		} );
		var data    = state[0];
		var setData = state[1];

		// Load current state once on mount
		_useEffect( function () {
			fetchStatus();
		}, [] );

		function fetchStatus() {
			setData( function ( d ) { return Object.assign( {}, d, { loading: true } ); } );

			wp.apiFetch( {
				path:   '/wp-json/showsup/v1/status',
				method: 'GET',
			} ).then( function ( res ) {
				setData( function ( d ) {
					return Object.assign( {}, d, {
						loading:    false,
						score:      res.score,
						lastScan:   res.last_scan,
						deployed:   res.llmstxt_deployed,
						deployedAt: res.llmstxt_deployed_at,
					} );
				} );
			} ).catch( function () {
				setData( function ( d ) { return Object.assign( {}, d, { loading: false } ); } );
			} );
		}

		function triggerScan() {
			setData( function ( d ) { return Object.assign( {}, d, { scanning: true, notice: null, error: null } ); } );

			wp.apiFetch( {
				path:   '/wp-json/showsup/v1/scan',
				method: 'POST',
			} ).then( function ( res ) {
				setData( function ( d ) {
					return Object.assign( {}, d, {
						scanning: false,
						score:    res.score,
						lastScan: res.last_scan,
						notice:   __( 'Scan complete! Score: ' + res.score + '/100', 'showsup' ),
					} );
				} );
			} ).catch( function ( err ) {
				setData( function ( d ) {
					return Object.assign( {}, d, {
						scanning: false,
						error: err.message || __( 'Scan failed.', 'showsup' ),
					} );
				} );
			} );
		}

		function deployLlmstxt() {
			setData( function ( d ) { return Object.assign( {}, d, { deploying: true, notice: null, error: null } ); } );

			wp.apiFetch( {
				path:   '/wp-json/showsup/v1/llmstxt/deploy',
				method: 'POST',
			} ).then( function ( res ) {
				setData( function ( d ) {
					return Object.assign( {}, d, {
						deploying:  false,
						deployed:   true,
						deployedAt: res.deployed_at,
						notice:     __( 'llms.txt deployed!', 'showsup' ),
					} );
				} );
			} ).catch( function ( err ) {
				setData( function ( d ) {
					return Object.assign( {}, d, {
						deploying: false,
						error: err.message || __( 'Deploy failed.', 'showsup' ),
					} );
				} );
			} );
		}

		// ── Render ─────────────────────────────────────────────────────────────

		var scoreColor = '#6b7280';
		if ( data.score !== null ) {
			scoreColor = data.score >= 70 ? '#10B981' : ( data.score >= 40 ? '#F59E0B' : '#EF4444' );
		}

		return el(
			wp.element.Fragment,
			null,

			// Menu item
			el(
				PluginSidebarMoreMenuItem,
				{ target: SIDEBAR_NAME },
				__( 'ShowsUp AI Visibility', 'showsup' )
			),

			// Sidebar panel
			el(
				PluginSidebar,
				{
					name:  SIDEBAR_NAME,
					title: __( 'AI Visibility', 'showsup' ),
					icon:  'visibility',
				},

				el(
					Panel,
					null,

					// Score panel
					el(
						PanelBody,
						{ title: __( 'AI Visibility Score', 'showsup' ), initialOpen: true },

						data.loading && el( Spinner ),

						! data.loading && data.score !== null && el(
							PanelRow,
							null,
							el(
								'div',
								{ style: { display: 'flex', alignItems: 'baseline', gap: '4px' } },
								el( 'span', { style: { fontSize: '40px', fontWeight: '800', color: scoreColor, lineHeight: '1' } }, data.score ),
								el( 'span', { style: { fontSize: '18px', color: '#6b7280' } }, '/100' )
							)
						),

						! data.loading && data.score === null && el(
							PanelRow,
							null,
							el( 'p', { style: { color: '#6b7280', fontSize: '13px', margin: 0 } },
								__( 'No scan yet.', 'showsup' ) )
						),

						data.lastScan && el(
							PanelRow,
							null,
							el( 'p', { style: { fontSize: '12px', color: '#9ca3af', margin: 0 } },
								__( 'Last scan: ', 'showsup' ) + data.lastScan )
						),

						el(
							PanelRow,
							null,
							el(
								Button,
								{
									variant:  'primary',
									isBusy:   data.scanning,
									disabled: data.scanning,
									onClick:  triggerScan,
									style:    { width: '100%', justifyContent: 'center' },
								},
								data.scanning ? __( 'Scanning…', 'showsup' ) : __( 'Run Scan', 'showsup' )
							)
						)
					),

					// llms.txt panel
					el(
						PanelBody,
						{ title: __( 'llms.txt', 'showsup' ), initialOpen: false },

						el(
							PanelRow,
							null,
							el(
								'div',
								{ style: { display: 'flex', alignItems: 'center', gap: '8px' } },
								el(
									'span',
									{
										style: {
											display:      'inline-block',
											padding:      '2px 8px',
											borderRadius: '9999px',
											fontSize:     '11px',
											fontWeight:   '600',
											background:   data.deployed ? '#d1fae5' : '#f3f4f6',
											color:        data.deployed ? '#065f46' : '#374151',
										},
									},
									data.deployed ? __( 'Active', 'showsup' ) : __( 'Not deployed', 'showsup' )
								),
								data.deployedAt && el( 'span', { style: { fontSize: '11px', color: '#9ca3af' } }, data.deployedAt )
							)
						),

						el(
							PanelRow,
							null,
							el(
								Button,
								{
									variant:  'secondary',
									isBusy:   data.deploying,
									disabled: data.deploying,
									onClick:  deployLlmstxt,
									style:    { width: '100%', justifyContent: 'center' },
								},
								data.deploying ? __( 'Deploying…', 'showsup' ) : (
									data.deployed ? __( 'Redeploy', 'showsup' ) : __( 'Deploy llms.txt', 'showsup' )
								)
							)
						)
					),

					// Notices
					( data.notice || data.error ) && el(
						PanelBody,
						{ title: '', initialOpen: true },
						data.notice && el(
							Notice,
							{ status: 'success', isDismissible: true, onRemove: function () { setData( function ( d ) { return Object.assign( {}, d, { notice: null } ); } ); } },
							data.notice
						),
						data.error && el(
							Notice,
							{ status: 'error', isDismissible: true, onRemove: function () { setData( function ( d ) { return Object.assign( {}, d, { error: null } ); } ); } },
							data.error
						)
					)
				)
			)
		);
	}

	// ── Register ───────────────────────────────────────────────────────────────

	registerPlugin( 'showsup', {
		render: ShowsUpSidebar,
		icon:   'visibility',
	} );

} )();
