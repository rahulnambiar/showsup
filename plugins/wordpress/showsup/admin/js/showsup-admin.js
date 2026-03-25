/* global ShowsUpAdmin, jQuery */
( function ( $ ) {
	'use strict';

	var pollTimer = null;

	// ── Helpers ────────────────────────────────────────────────────────────────

	function ajaxPost( action, data, done, fail ) {
		$.post( ShowsUpAdmin.ajaxUrl, $.extend( { action: action, nonce: ShowsUpAdmin.nonce }, data ) )
			.done( function ( res ) {
				if ( res.success ) {
					done( res.data );
				} else {
					if ( fail ) fail( res.data && res.data.message ? res.data.message : 'Error' );
				}
			} )
			.fail( function () {
				if ( fail ) fail( 'Request failed. Please try again.' );
			} );
	}

	function spinner() {
		return '<span class="showsup-spinner"></span>';
	}

	// ── Scan ──────────────────────────────────────────────────────────────────

	$( '#showsup-run-scan' ).on( 'click', function () {
		var $btn    = $( this );
		var $status = $( '#showsup-scan-status' );

		$btn.prop( 'disabled', true ).text( ShowsUpAdmin.i18n.scanning );
		$status.html( spinner() );

		ajaxPost( 'showsup_trigger_scan', {}, function ( data ) {
			$btn.prop( 'disabled', false ).text( 'Re-scan Now' );
			$status.text( ShowsUpAdmin.i18n.scanComplete );

			// Update score display if present
			if ( data.score !== null ) {
				var cls = data.score >= 70 ? 'green' : ( data.score >= 40 ? 'amber' : 'red' );
				$( '.showsup-big-score' )
					.text( data.score )
					.attr( 'class', 'showsup-big-score showsup-score--' + cls );
			}

			// Reload page after 1.5s to refresh all data
			setTimeout( function () { location.reload(); }, 1500 );

		}, function ( msg ) {
			$btn.prop( 'disabled', false ).text( 'Run Scan' );
			$status.text( ShowsUpAdmin.i18n.scanError + ' ' + msg );
		} );
	} );

	// ── Poll scan status (if scanning on page load) ────────────────────────────

	function checkScanStatus() {
		ajaxPost( 'showsup_get_status', {}, function ( data ) {
			if ( data.status === 'scanning' ) {
				if ( ! pollTimer ) {
					pollTimer = setInterval( checkScanStatus, 3000 );
				}
			} else {
				clearInterval( pollTimer );
				pollTimer = null;
			}
		} );
	}

	// ── llms.txt ──────────────────────────────────────────────────────────────

	$( '#showsup-deploy-llmstxt' ).on( 'click', function () {
		var $btn = $( this );
		$btn.prop( 'disabled', true ).html( spinner() + ShowsUpAdmin.i18n.deploying );

		ajaxPost( 'showsup_deploy_llmstxt', {}, function ( data ) {
			$btn.prop( 'disabled', false ).text( 'Redeploy' );
			// Update deployed badge
			$( '.showsup-llmstxt-status .showsup-badge' )
				.attr( 'class', 'showsup-badge showsup-badge--green' )
				.text( 'Active' );
			$( '.showsup-llmstxt-time' ).text( data.label || '' );
		}, function ( msg ) {
			$btn.prop( 'disabled', false ).text( 'Deploy llms.txt' );
			alert( msg );
		} );
	} );

	// ── Apply Fix Buttons ─────────────────────────────────────────────────────

	$( document ).on( 'click', '.showsup-apply-fix', function () {
		var $btn     = $( this );
		var fixType  = $btn.data( 'fix-type' );

		$btn.prop( 'disabled', true ).html( spinner() + 'Applying…' );

		ajaxPost( 'showsup_apply_fix', { fix_type: fixType }, function () {
			$btn.prop( 'disabled', false ).text( 'Applied ✓' ).addClass( 'button-primary' );
		}, function ( msg ) {
			$btn.prop( 'disabled', false ).text( 'Retry' );
			alert( msg );
		} );
	} );

	// ── Settings Form ─────────────────────────────────────────────────────────

	$( '#showsup-settings-form' ).on( 'submit', function ( e ) {
		e.preventDefault();

		var $btn    = $( '#showsup-save-settings' );
		var $status = $( '#showsup-settings-status' );

		$btn.prop( 'disabled', true ).html( spinner() + ShowsUpAdmin.i18n.saving );
		$status.text( '' );

		// Collect all form data including checkboxes / multi-selects
		var formData = {};
		$( this ).serializeArray().forEach( function ( item ) {
			// Handle arrays (regions[])
			var match = item.name.match( /^settings\[([^\]]+)\]\[\]$/ );
			if ( match ) {
				var key = match[1];
				if ( ! formData[ key ] ) formData[ key ] = [];
				formData[ key ].push( item.value );
			} else {
				var singleMatch = item.name.match( /^settings\[([^\]]+)\]$/ );
				if ( singleMatch ) {
					formData[ singleMatch[1] ] = item.value;
				}
			}
		} );

		ajaxPost( 'showsup_save_settings', { settings: formData }, function ( data ) {
			$btn.prop( 'disabled', false ).text( 'Save Settings' );
			$status.text( data.message || ShowsUpAdmin.i18n.saved );
			setTimeout( function () { $status.text( '' ); }, 3000 );
		}, function ( msg ) {
			$btn.prop( 'disabled', false ).text( 'Save Settings' );
			$status.css( 'color', '#ef4444' ).text( msg );
		} );
	} );

	// ── Refresh Fixes ─────────────────────────────────────────────────────────

	$( '#showsup-refresh-fixes' ).on( 'click', function () {
		var $btn = $( this );
		$btn.prop( 'disabled', true ).html( spinner() + 'Refreshing…' );

		ajaxPost( 'showsup_get_fixes', {}, function () {
			location.reload();
		}, function ( msg ) {
			$btn.prop( 'disabled', false ).text( 'Refresh Fixes' );
			alert( msg );
		} );
	} );

} )( jQuery );
